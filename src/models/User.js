const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Personal Information
  ownerManagerName: {
    type: String,
    required: [true, 'Owner/Manager name is required'],
    trim: true,
    maxlength: [100, 'Owner/Manager name cannot exceed 100 characters'],
  },
  // Email field removed - not needed for current registration flow
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  password: {
    type: String,
    required: function() {
      return this.status === 'active';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },

  // Warehouse Details
  warehouseName: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    maxlength: [100, 'Warehouse name cannot exceed 100 characters'],
  },
  warehouseAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
  },
  warehouseCapacity: {
    type: Number,
    min: [1, 'Warehouse capacity must be at least 1'],
  },

  // Account Status
  status: {
    type: String,
    enum: ['pending', 'otp-verified', 'active', 'inactive'],
    default: 'pending',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isOtpVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user',
  },

  // OTP Management
  otp: {
    code: { type: String, select: false },
    expiresAt: { type: Date, select: false },
    attempts: { type: Number, default: 0, select: false },
    type: { 
      type: String, 
      enum: ['registration', 'login', 'password-reset', 'phone-verification'],
      select: false 
    },
  },

  // Password Reset
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  // Login Tracking
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  // Profile Image
  profileImage: {
    type: String,
    default: null,
  },

  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name (use ownerManagerName as full name)
userSchema.virtual('fullName').get(function() {
  return this.ownerManagerName;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ warehouseName: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate OTP (always returns 1234 for testing)
userSchema.methods.generateOTP = function(type = 'verification') {
  const otp = '1234'; // Always use 1234 for easy testing
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  this.otp = {
    code: otp,
    expiresAt,
    attempts: 0,
    type,
  };

  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(candidateOTP) {
  if (!this.otp || !this.otp.code) {
    return { success: false, message: 'No OTP found' };
  }

  if (this.otp.expiresAt < new Date()) {
    return { success: false, message: 'OTP has expired' };
  }

  if (this.otp.attempts >= 3) {
    return { success: false, message: 'Too many OTP attempts' };
  }

  if (this.otp.code !== candidateOTP) {
    this.otp.attempts += 1;
    return { success: false, message: 'Invalid OTP' };
  }

  // OTP is valid
  this.otp = undefined;
  return { success: true, message: 'OTP verified successfully' };
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);
