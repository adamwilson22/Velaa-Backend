const { sendSMS, sendOTP, smsConfig } = require('../config/sms');
const User = require('../models/User');
const Notification = require('../models/Notification');

class SMSService {
  constructor() {
    this.rateLimitStore = new Map(); // In-memory store for rate limiting
  }

  // Check rate limiting for phone number
  checkRateLimit(phoneNumber, type = 'general') {
    const key = `${phoneNumber}:${type}`;
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000); // 1 hour ago
    const dayAgo = now - (24 * 60 * 60 * 1000); // 24 hours ago

    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, []);
    }

    const attempts = this.rateLimitStore.get(key);
    
    // Clean old attempts
    const recentAttempts = attempts.filter(timestamp => timestamp > hourAgo);
    const dailyAttempts = attempts.filter(timestamp => timestamp > dayAgo);
    
    this.rateLimitStore.set(key, recentAttempts);

    // Check limits
    if (recentAttempts.length >= smsConfig.maxOtpPerHour) {
      throw new Error(`Too many SMS requests. Maximum ${smsConfig.maxOtpPerHour} per hour allowed.`);
    }

    if (dailyAttempts.length >= smsConfig.maxOtpPerDay) {
      throw new Error(`Daily SMS limit exceeded. Maximum ${smsConfig.maxOtpPerDay} per day allowed.`);
    }

    // Add current attempt
    recentAttempts.push(now);
    this.rateLimitStore.set(key, recentAttempts);

    return true;
  }

  // Send OTP for user registration
  async sendRegistrationOTP(phoneNumber, userData = {}) {
    try {
      this.checkRateLimit(phoneNumber, 'registration');

      const result = await sendOTP(phoneNumber, 'registration');
      
      // Log the SMS sending attempt
      console.log(`Registration OTP sent to ${phoneNumber}:`, {
        messageId: result.messageId,
        status: result.status,
      });

      return {
        success: true,
        message: 'Registration OTP sent successfully',
        messageId: result.messageId,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error('Registration OTP sending failed:', error);
      throw new Error(`Failed to send registration OTP: ${error.message}`);
    }
  }

  // Send OTP for login
  async sendLoginOTP(phoneNumber) {
    try {
      this.checkRateLimit(phoneNumber, 'login');

      // Check if user exists
      const user = await User.findOne({ phone: phoneNumber });
      if (!user) {
        throw new Error('User not found with this phone number');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      if (user.isLocked) {
        throw new Error('Account is temporarily locked');
      }

      const result = await sendOTP(phoneNumber, 'login');
      
      // Save OTP to user record
      user.generateOTP('login');
      await user.save();

      console.log(`Login OTP sent to ${phoneNumber}:`, {
        messageId: result.messageId,
        status: result.status,
      });

      return {
        success: true,
        message: 'Login OTP sent successfully',
        messageId: result.messageId,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error('Login OTP sending failed:', error);
      throw new Error(`Failed to send login OTP: ${error.message}`);
    }
  }

  // Send OTP for password reset
  async sendPasswordResetOTP(phoneNumber) {
    try {
      this.checkRateLimit(phoneNumber, 'password-reset');

      // Check if user exists
      const user = await User.findOne({ phone: phoneNumber });
      if (!user) {
        throw new Error('User not found with this phone number');
      }

      const result = await sendOTP(phoneNumber, 'passwordReset');
      
      // Save OTP to user record
      user.generateOTP('password-reset');
      await user.save();

      console.log(`Password reset OTP sent to ${phoneNumber}:`, {
        messageId: result.messageId,
        status: result.status,
      });

      return {
        success: true,
        message: 'Password reset OTP sent successfully',
        messageId: result.messageId,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error('Password reset OTP sending failed:', error);
      throw new Error(`Failed to send password reset OTP: ${error.message}`);
    }
  }

  // Send OTP for phone verification
  async sendPhoneVerificationOTP(phoneNumber, userId) {
    try {
      this.checkRateLimit(phoneNumber, 'phone-verification');

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const result = await sendOTP(phoneNumber, 'verification');
      
      // Save OTP to user record
      user.generateOTP('phone-verification');
      await user.save();

      console.log(`Phone verification OTP sent to ${phoneNumber}:`, {
        messageId: result.messageId,
        status: result.status,
      });

      return {
        success: true,
        message: 'Phone verification OTP sent successfully',
        messageId: result.messageId,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error('Phone verification OTP sending failed:', error);
      throw new Error(`Failed to send phone verification OTP: ${error.message}`);
    }
  }

  // Send custom SMS
  async sendCustomSMS(phoneNumber, message, options = {}) {
    try {
      const { 
        skipRateLimit = false,
        type = 'general',
        userId = null,
        createNotification = false 
      } = options;

      if (!skipRateLimit) {
        this.checkRateLimit(phoneNumber, type);
      }

      const result = await sendSMS(phoneNumber, message);

      // Create notification if requested
      if (createNotification && userId) {
        await Notification.create({
          recipient: userId,
          title: 'SMS Sent',
          message: `SMS sent to ${phoneNumber}`,
          type: 'info',
          category: 'system',
          delivery: {
            channels: ['sms'],
            smsSent: true,
            smsSentAt: new Date(),
          },
        });
      }

      console.log(`Custom SMS sent to ${phoneNumber}:`, {
        messageId: result.messageId,
        status: result.status,
      });

      return {
        success: true,
        message: 'SMS sent successfully',
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Custom SMS sending failed:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Send bulk SMS
  async sendBulkSMS(recipients, message, options = {}) {
    const results = [];
    const { 
      skipRateLimit = false,
      type = 'bulk',
      batchSize = 10,
      delay = 1000 // 1 second delay between batches
    } = options;

    // Process recipients in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const phoneNumber = typeof recipient === 'string' ? recipient : recipient.phone;
          const userId = typeof recipient === 'object' ? recipient.userId : null;

          const result = await this.sendCustomSMS(phoneNumber, message, {
            skipRateLimit,
            type,
            userId,
            createNotification: false, // Don't create individual notifications for bulk
          });

          return {
            phoneNumber,
            success: true,
            messageId: result.messageId,
          };
        } catch (error) {
          return {
            phoneNumber: typeof recipient === 'string' ? recipient : recipient.phone,
            success: false,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => result.value || result.reason));

      // Add delay between batches (except for the last batch)
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`Bulk SMS completed: ${successCount} successful, ${failureCount} failed`);

    return {
      success: true,
      message: `Bulk SMS completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    };
  }

  // Send notification SMS
  async sendNotificationSMS(phoneNumber, title, message, userId = null) {
    try {
      const smsMessage = `${title}\n\n${message}`;
      
      const result = await this.sendCustomSMS(phoneNumber, smsMessage, {
        type: 'notification',
        userId,
        createNotification: true,
      });

      return result;
    } catch (error) {
      console.error('Notification SMS sending failed:', error);
      throw new Error(`Failed to send notification SMS: ${error.message}`);
    }
  }

  // Send reminder SMS
  async sendReminderSMS(phoneNumber, reminderType, data, userId = null) {
    try {
      let message = '';

      switch (reminderType) {
        case 'payment_due':
          message = `Payment Reminder: Your payment of ₹${data.amount} for invoice ${data.invoiceNumber} is due on ${data.dueDate}. Please make the payment to avoid late fees.`;
          break;
        case 'document_expiry':
          message = `Document Expiry Alert: Your ${data.documentType} for vehicle ${data.vehicleNumber} will expire on ${data.expiryDate}. Please renew it soon.`;
          break;
        case 'maintenance_due':
          message = `Maintenance Reminder: Vehicle ${data.vehicleNumber} is due for ${data.maintenanceType} on ${data.dueDate}.`;
          break;
        case 'appointment':
          message = `Appointment Reminder: You have an appointment scheduled for ${data.date} at ${data.time}. Location: ${data.location}`;
          break;
        default:
          message = data.message || 'You have a reminder from Velaa Vehicle Management System.';
      }

      const result = await this.sendCustomSMS(phoneNumber, message, {
        type: 'reminder',
        userId,
        createNotification: true,
      });

      return result;
    } catch (error) {
      console.error('Reminder SMS sending failed:', error);
      throw new Error(`Failed to send reminder SMS: ${error.message}`);
    }
  }

  // Get SMS statistics
  getSMSStats() {
    const stats = {
      totalNumbers: this.rateLimitStore.size,
      recentActivity: [],
    };

    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    for (const [key, attempts] of this.rateLimitStore.entries()) {
      const recentAttempts = attempts.filter(timestamp => timestamp > hourAgo);
      if (recentAttempts.length > 0) {
        const [phoneNumber, type] = key.split(':');
        stats.recentActivity.push({
          phoneNumber,
          type,
          attempts: recentAttempts.length,
          lastAttempt: new Date(Math.max(...recentAttempts)),
        });
      }
    }

    return stats;
  }

  // Clear rate limit for a phone number (admin function)
  clearRateLimit(phoneNumber, type = null) {
    if (type) {
      const key = `${phoneNumber}:${type}`;
      this.rateLimitStore.delete(key);
    } else {
      // Clear all rate limits for this phone number
      for (const key of this.rateLimitStore.keys()) {
        if (key.startsWith(`${phoneNumber}:`)) {
          this.rateLimitStore.delete(key);
        }
      }
    }

    return {
      success: true,
      message: 'Rate limit cleared successfully',
    };
  }
}

// Create and export singleton instance
const smsService = new SMSService();

module.exports = smsService;
