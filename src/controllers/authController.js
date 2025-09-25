const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const smsService = require('../services/smsService');
const { responseHelpers } = require('../utils/helpers');
const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const Validators = require('../utils/validators');

class AuthController {
  // Step 1: Initial user registration (basic info only)
  async register(req, res) {
    try {
      const userData = req.body;

      // Validate registration data
      const validation = Validators.validateRegistrationData(userData);
      if (!validation.isValid) {
        return responseHelpers.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      // Check if user already exists with this phone
      const existingUser = await User.findOne({ phone: userData.phone });

      if (existingUser) {
        return responseHelpers.error(res, 'User already exists with this phone number', HTTP_STATUS.CONFLICT);
      }

      // Create new user with minimal data and 'pending' status
      const user = new User({
        ownerManagerName: userData.ownerManagerName,
        warehouseName: userData.warehouseName,
        phone: userData.phone,
        status: 'pending'
      });
      
      await user.save();

      // Generate OTP for phone verification
      const otp = user.generateOTP('registration');
      await user.save();

      // Send OTP via SMS
      try {
        await smsService.sendRegistrationOTP(userData.phone, {
          name: user.fullName,
          warehouseName: user.warehouseName
        });
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        // Continue with registration even if SMS fails
      }

      return responseHelpers.success(res, {
        message: 'Registration initiated. Please verify your phone number with the OTP sent.',
        userId: user._id,
        phone: user.phone,
        ownerManagerName: user.ownerManagerName,
        warehouseName: user.warehouseName,
        otpSent: true,
        nextStep: 'verify-otp'
      }, SUCCESS_MESSAGES.REGISTRATION_SUCCESS, HTTP_STATUS.CREATED);

    } catch (error) {
      console.error('Registration error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Step 3: Complete registration (password creation only)
  async completeRegistration(req, res) {
    try {
      const { phone, password } = req.body;

      // Validate complete registration data
      const validation = Validators.validateCompleteRegistrationData(req.body);
      if (!validation.isValid) {
        return responseHelpers.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      // Find user with otp-verified status
      const user = await User.findOne({ phone, status: 'otp-verified' });
      if (!user) {
        return responseHelpers.error(res, 'User not found or OTP not verified yet', HTTP_STATUS.NOT_FOUND);
      }

      // Check if OTP is verified
      if (!user.isOtpVerified) {
        return responseHelpers.error(res, 'Please verify your OTP first', HTTP_STATUS.BAD_REQUEST);
      }

      // Set password and update status to active
      user.password = password;
      user.status = 'active';
      await user.save();

      // Generate JWT token
      const token = generateToken({ userId: user._id, role: user.role });

      return responseHelpers.success(res, {
        message: 'Registration completed successfully! You can now use your account.',
        token,
        user: {
          id: user._id,
          ownerManagerName: user.ownerManagerName,
          phone: user.phone,
          warehouseName: user.warehouseName,
          status: user.status,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
          isOtpVerified: user.isOtpVerified,
          createdAt: user.createdAt
        }
      }, SUCCESS_MESSAGES.REGISTRATION_COMPLETED, HTTP_STATUS.OK);

    } catch (error) {
      console.error('Complete registration error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Step 2: Verify OTP only (no password creation)
  async verifyOtp(req, res) {
    try {
      const { phone, otp } = req.body;

      // Validate OTP verification data
      const validation = Validators.validateOtpVerificationData(req.body);
      if (!validation.isValid) {
        return responseHelpers.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      // Find user with pending status (include OTP fields)
      const user = await User.findOne({ phone, status: 'pending' }).select('+otp.code +otp.expiresAt +otp.attempts +otp.type');
      if (!user) {
        return responseHelpers.error(res, 'User not found or OTP already verified', HTTP_STATUS.NOT_FOUND);
      }

      // Verify OTP
      const otpValidation = user.verifyOTP(otp);
      if (!otpValidation.success) {
        return responseHelpers.error(res, otpValidation.message, HTTP_STATUS.BAD_REQUEST);
      }

      // Mark OTP as verified and update status
      user.isPhoneVerified = true;
      user.isOtpVerified = true;
      user.status = 'otp-verified';
      await user.save();

      return responseHelpers.success(res, {
        message: 'OTP verified successfully! Now create your password.',
        user: {
          id: user._id,
          ownerManagerName: user.ownerManagerName,
          phone: user.phone,
          warehouseName: user.warehouseName,
          status: user.status,
          isPhoneVerified: user.isPhoneVerified,
          isOtpVerified: user.isOtpVerified
        },
        nextStep: 'create-password'
      }, SUCCESS_MESSAGES.OTP_VERIFIED);

    } catch (error) {
      console.error('OTP verification error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // User login
  async login(req, res) {
    try {
      const { phone, password } = req.body;

      // Find user by phone and include password
      const user = await User.findOne({ phone }).select('+password');
      if (!user) {
        return responseHelpers.error(res, 'Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
      }

      // Check if account is locked
      if (user.isLocked) {
        return responseHelpers.error(res, 'Account is temporarily locked due to multiple failed attempts', HTTP_STATUS.UNAUTHORIZED);
      }

      // Check if account is active
      if (!user.isActive) {
        return responseHelpers.error(res, 'Account is deactivated', HTTP_STATUS.UNAUTHORIZED);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        return responseHelpers.error(res, 'Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken({ userId: user._id, role: user.role });

      return responseHelpers.success(res, {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          warehouseName: user.warehouseName,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        }
      }, SUCCESS_MESSAGES.LOGIN_SUCCESS);

    } catch (error) {
      console.error('Login error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { phone } = req.body;

      // Find user by phone
      const user = await User.findOne({ phone });
      if (!user) {
        // Don't reveal if user exists or not
        return responseHelpers.success(res, {
          message: 'If a user with this phone number exists, a password reset OTP has been sent.'
        }, 'Password reset OTP sent');
      }

      // Generate OTP for password reset
      const otp = user.generateOTP('password-reset');
      await user.save();

      // Send OTP via SMS
      try {
        await smsService.sendPasswordResetOTP(phone);
      } catch (smsError) {
        console.error('Password reset SMS sending failed:', smsError);
        return responseHelpers.error(res, 'Failed to send OTP. Please try again.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      return responseHelpers.success(res, {
        message: 'Password reset OTP sent to your phone number.'
      }, 'Password reset OTP sent');

    } catch (error) {
      console.error('Forgot password error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Verify recovery OTP
  async verifyRecoveryOtp(req, res) {
    try {
      const { phone, otp } = req.body;

      // Find user by phone
      const user = await User.findOne({ phone });
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Verify OTP
      const otpValidation = user.verifyOTP(otp);
      if (!otpValidation.success) {
        return responseHelpers.error(res, otpValidation.message, HTTP_STATUS.BAD_REQUEST);
      }

      // Generate temporary token for password reset
      const resetToken = generateToken({ userId: user._id, type: 'password-reset' });

      return responseHelpers.success(res, {
        resetToken,
        message: 'OTP verified. You can now reset your password.'
      }, 'OTP verified successfully');

    } catch (error) {
      console.error('Recovery OTP verification error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { phone, otp, newPassword } = req.body;

      // Find user by phone
      const user = await User.findOne({ phone });
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Verify OTP one more time
      const otpValidation = user.verifyOTP(otp);
      if (!otpValidation.success) {
        return responseHelpers.error(res, otpValidation.message, HTTP_STATUS.BAD_REQUEST);
      }

      // Validate new password
      const passwordValidation = Validators.validateUserData({ password: newPassword });
      if (!passwordValidation.isValid) {
        return responseHelpers.error(res, 'Password validation failed', HTTP_STATUS.BAD_REQUEST, passwordValidation.errors);
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return responseHelpers.success(res, {
        message: 'Password reset successful. You can now login with your new password.'
      }, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);

    } catch (error) {
      console.error('Password reset error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // User logout
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // Here we can add token to a blacklist if needed
      
      return responseHelpers.success(res, {
        message: 'Logged out successfully'
      }, SUCCESS_MESSAGES.LOGOUT_SUCCESS);

    } catch (error) {
      console.error('Logout error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      return responseHelpers.success(res, {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          warehouseName: user.warehouseName,
          warehouseAddress: user.warehouseAddress,
          warehouseCapacity: user.warehouseCapacity,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          profileImage: user.profileImage,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }, 'Profile retrieved successfully');

    } catch (error) {
      console.error('Get profile error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.role;
      delete updateData.isActive;
      delete updateData.isPhoneVerified;
      delete updateData.isEmailVerified;

      // Validate update data
      const validation = Validators.validateUserData(updateData);
      if (!validation.isValid) {
        return responseHelpers.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedBy: userId },
        { new: true, runValidators: true }
      );

      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      return responseHelpers.success(res, {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          warehouseName: user.warehouseName,
          warehouseAddress: user.warehouseAddress,
          warehouseCapacity: user.warehouseCapacity,
          preferences: user.preferences,
          updatedAt: user.updatedAt
        }
      }, SUCCESS_MESSAGES.UPDATED_SUCCESS);

    } catch (error) {
      console.error('Update profile error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Admin: Get all users
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search, role, status } = req.query;
      
      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { warehouseName: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (role) {
        query.role = role;
      }
      
      if (status) {
        query.isActive = status === 'active';
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const users = await User.find(query)
        .select('-password -otp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return responseHelpers.paginated(res, users, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }, 'Users retrieved successfully');

    } catch (error) {
      console.error('Get all users error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Admin: Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-password -otp');
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      return responseHelpers.success(res, {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          warehouseName: user.warehouseName,
          warehouseAddress: user.warehouseAddress,
          warehouseCapacity: user.warehouseCapacity,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          profileImage: user.profileImage,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          loginAttempts: user.loginAttempts,
          isLocked: user.isLocked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }, 'User retrieved successfully');

    } catch (error) {
      console.error('Get user by ID error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Admin: Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminId = req.user._id;

      // Find user to update
      const user = await User.findById(id);
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Prevent admin from updating their own role or status
      if (user._id.toString() === adminId.toString()) {
        delete updateData.role;
        delete updateData.isActive;
      }

      // Validate update data
      const validation = Validators.validateUserData(updateData);
      if (!validation.isValid) {
        return responseHelpers.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.otp;
      delete updateData.loginAttempts;
      delete updateData.lockUntil;

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: adminId },
        { new: true, runValidators: true }
      ).select('-password -otp');

      return responseHelpers.success(res, {
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          warehouseName: updatedUser.warehouseName,
          warehouseAddress: updatedUser.warehouseAddress,
          warehouseCapacity: updatedUser.warehouseCapacity,
          isPhoneVerified: updatedUser.isPhoneVerified,
          isEmailVerified: updatedUser.isEmailVerified,
          isActive: updatedUser.isActive,
          preferences: updatedUser.preferences,
          updatedAt: updatedUser.updatedAt
        }
      }, SUCCESS_MESSAGES.UPDATED_SUCCESS);

    } catch (error) {
      console.error('Update user error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Admin: Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user._id;

      // Find user to delete
      const user = await User.findById(id);
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === adminId.toString()) {
        return responseHelpers.error(res, 'Cannot delete your own account', HTTP_STATUS.FORBIDDEN);
      }

      // Prevent deleting other admins (only super admin can do this)
      if (user.role === 'admin' && req.user.role !== 'super_admin') {
        return responseHelpers.error(res, 'Cannot delete admin accounts', HTTP_STATUS.FORBIDDEN);
      }

      // Check if user has associated data (vehicles, clients, etc.)
      // This would require importing other models, for now we'll just delete
      
      // Soft delete by deactivating instead of hard delete
      await User.findByIdAndUpdate(id, { 
        isActive: false,
        updatedBy: adminId,
        deletedAt: new Date()
      });

      return responseHelpers.success(res, {
        message: 'User account deactivated successfully',
        userId: id
      }, SUCCESS_MESSAGES.DELETED_SUCCESS);

    } catch (error) {
      console.error('Delete user error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Change password (authenticated users)
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Get user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return responseHelpers.error(res, 'Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate new password
      const passwordValidation = Validators.validateUserData({ password: newPassword });
      if (!passwordValidation.isValid) {
        return responseHelpers.error(res, 'Password validation failed', HTTP_STATUS.BAD_REQUEST, passwordValidation.errors);
      }

      // Check if new password is different from current
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return responseHelpers.error(res, 'New password must be different from current password', HTTP_STATUS.BAD_REQUEST);
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return responseHelpers.success(res, {
        message: 'Password changed successfully'
      }, 'Password changed successfully');

    } catch (error) {
      console.error('Change password error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Send phone verification OTP
  async sendPhoneVerificationOTP(req, res) {
    try {
      const userId = req.user._id;
      const { phone } = req.body;

      // Check if phone is already verified for this user
      const user = await User.findById(userId);
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      if (user.phone === phone && user.isPhoneVerified) {
        return responseHelpers.error(res, 'Phone number is already verified', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if phone is already used by another user
      if (phone !== user.phone) {
        const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
        if (existingUser) {
          return responseHelpers.error(res, 'Phone number is already registered with another account', HTTP_STATUS.CONFLICT);
        }
      }

      // Generate and save OTP
      const otp = user.generateOTP('phone-verification');
      await user.save();

      // Send OTP via SMS
      try {
        await smsService.sendPhoneVerificationOTP(phone, userId);
      } catch (smsError) {
        console.error('Phone verification SMS sending failed:', smsError);
        // Continue even if SMS fails in development
      }

      return responseHelpers.success(res, {
        message: 'Phone verification OTP sent successfully',
        phone,
        otpSent: true
      }, SUCCESS_MESSAGES.OTP_SENT);

    } catch (error) {
      console.error('Send phone verification OTP error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Verify phone number
  async verifyPhoneNumber(req, res) {
    try {
      const { phone, otp } = req.body;
      const userId = req.user._id;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return responseHelpers.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Verify OTP
      const otpValidation = user.verifyOTP(otp);
      if (!otpValidation.success) {
        return responseHelpers.error(res, otpValidation.message, HTTP_STATUS.BAD_REQUEST);
      }

      // Update phone and mark as verified
      user.phone = phone;
      user.isPhoneVerified = true;
      await user.save();

      return responseHelpers.success(res, {
        message: 'Phone number verified successfully',
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified
      }, 'Phone number verified successfully');

    } catch (error) {
      console.error('Verify phone number error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get user statistics (Admin only)
  async getUserStats(req, res) {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
            verifiedUsers: { $sum: { $cond: ['$isPhoneVerified', 1, 0] } },
            adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            managerUsers: { $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] } },
            regularUsers: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } }
          }
        }
      ]);

      const roleStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const recentUsers = await User.find()
        .select('firstName lastName email phone role isActive createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

      return responseHelpers.success(res, {
        overview: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          verifiedUsers: 0,
          adminUsers: 0,
          managerUsers: 0,
          regularUsers: 0
        },
        roleDistribution: roleStats,
        recentUsers
      }, 'User statistics retrieved successfully');

    } catch (error) {
      console.error('Get user stats error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new AuthController();
