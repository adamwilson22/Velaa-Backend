const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
  },
  
  // Notification Content
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  
  // Notification Type and Category
  type: {
    type: String,
    enum: [
      'info',           // General information
      'success',        // Success messages
      'warning',        // Warning messages
      'error',          // Error messages
      'reminder',       // Reminders
      'alert',          // Important alerts
    ],
    required: [true, 'Notification type is required'],
    default: 'info',
  },
  category: {
    type: String,
    enum: [
      'system',         // System notifications
      'vehicle',        // Vehicle-related
      'client',         // Client-related
      'billing',        // Billing-related
      'payment',        // Payment-related
      'maintenance',    // Maintenance-related
      'security',       // Security-related
      'user',           // User account-related
      'general',        // General notifications
    ],
    required: [true, 'Notification category is required'],
    default: 'general',
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  
  // Status Information
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  
  // Related Entity Information
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Vehicle', 'Client', 'Billing', 'User', 'Other'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    entityData: {
      type: mongoose.Schema.Types.Mixed, // Store relevant entity data
    },
  },
  
  // Action Information
  action: {
    type: {
      type: String,
      enum: ['none', 'redirect', 'modal', 'external_link'],
      default: 'none',
    },
    url: {
      type: String,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Additional action data
    },
  },
  
  // Delivery Information
  delivery: {
    channels: [{
      type: String,
      enum: ['in-app', 'email', 'sms', 'push'],
    }],
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
    smsSentAt: {
      type: Date,
    },
    pushSent: {
      type: Boolean,
      default: false,
    },
    pushSentAt: {
      type: Date,
    },
  },
  
  // Scheduling
  scheduledFor: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Auto-delete configuration
  autoDelete: {
    type: Boolean,
    default: false,
  },
  autoDeleteAfter: {
    type: Number, // Days after which to auto-delete
    default: 30,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInMs = now - created;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return created.toLocaleDateString();
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for is scheduled
notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledFor && new Date() < this.scheduledFor;
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

// Compound indexes
notificationSchema.index({ recipient: 1, category: 1, status: 1 });
notificationSchema.index({ recipient: 1, priority: 1, isRead: 1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Update isRead based on status
  if (this.status === 'read' && !this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  
  // Set default expiry if not provided
  if (!this.expiresAt && this.autoDelete) {
    this.expiresAt = new Date(Date.now() + (this.autoDeleteAfter * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    type,
    priority,
    unreadOnly = false
  } = options;
  
  const query = {
    recipient: userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  if (category) query.category = category;
  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (unreadOnly) query.isRead = false;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'firstName lastName')
    .populate('relatedEntity.entityId');
};

notificationSchema.statics.markAllAsRead = function(userId, category) {
  const query = { recipient: userId, isRead: false };
  if (category) query.category = category;
  
  return this.updateMany(query, {
    $set: {
      isRead: true,
      readAt: new Date(),
      status: 'read'
    }
  });
};

notificationSchema.statics.deleteExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

notificationSchema.statics.getNotificationStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        recipient: mongoose.Types.ObjectId(userId),
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        },
        urgent: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

notificationSchema.methods.sendEmail = function() {
  // Implementation would depend on email service
  this.delivery.emailSent = true;
  this.delivery.emailSentAt = new Date();
  return this.save();
};

notificationSchema.methods.sendSMS = function() {
  // Implementation would depend on SMS service
  this.delivery.smsSent = true;
  this.delivery.smsSentAt = new Date();
  return this.save();
};

notificationSchema.methods.sendPush = function() {
  // Implementation would depend on push notification service
  this.delivery.pushSent = true;
  this.delivery.pushSentAt = new Date();
  return this.save();
};

// Helper method to create notifications
notificationSchema.statics.createNotification = function(data) {
  const notification = new this(data);
  return notification.save();
};

// Helper method to create bulk notifications
notificationSchema.statics.createBulkNotifications = function(recipients, notificationData) {
  const notifications = recipients.map(recipientId => ({
    ...notificationData,
    recipient: recipientId
  }));
  
  return this.insertMany(notifications);
};

module.exports = mongoose.model('Notification', notificationSchema);
