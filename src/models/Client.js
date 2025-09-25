const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Personal/Company Information
  type: {
    type: String,
    enum: ['Individual', 'Company'],
    required: [true, 'Client type is required'],
    default: 'Individual',
  },
  
  // For Individual clients
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    required: function() { return this.type === 'Individual'; },
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    required: function() { return this.type === 'Individual'; },
  },
  
  // For Company clients
  companyName: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
    required: function() { return this.type === 'Company'; },
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    required: function() { return this.type === 'Company'; },
  },
  
  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  alternatePhone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid alternate phone number'],
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters'],
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
      match: [/^\d{5,6}$/, 'Please enter a valid ZIP code'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
    },
  },
  
  // Identification Documents
  identificationDocuments: [{
    type: {
      type: String,
      enum: ['Aadhaar', 'PAN', 'Driving License', 'Passport', 'Voter ID', 'GST Certificate', 'Other'],
      required: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    url: {
      type: String, // File URL
    },
    expiryDate: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Financial Information
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative'],
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: [0, 'Total purchases cannot be negative'],
  },
  totalPayments: {
    type: Number,
    default: 0,
    min: [0, 'Total payments cannot be negative'],
  },
  
  // Client Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blocked', 'Pending Verification'],
    default: 'Active',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // Business Information (for companies)
  businessDetails: {
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number'],
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number'],
    },
    businessType: {
      type: String,
      enum: ['Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'],
    },
    establishedYear: {
      type: Number,
      min: [1900, 'Established year must be after 1900'],
      max: [new Date().getFullYear(), 'Established year cannot be in the future'],
    },
  },
  
  // Preferences
  preferences: {
    preferredPaymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card'],
      default: 'Cash',
    },
    communicationPreference: {
      type: String,
      enum: ['Phone', 'Email', 'SMS', 'WhatsApp'],
      default: 'Phone',
    },
    language: {
      type: String,
      default: 'English',
    },
  },
  
  // Relationship Information
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  relationshipManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Important Dates
  firstPurchaseDate: {
    type: Date,
  },
  lastPurchaseDate: {
    type: Date,
  },
  lastContactDate: {
    type: Date,
  },
  
  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  
  // Rating and Feedback
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
clientSchema.virtual('fullName').get(function() {
  if (this.type === 'Individual') {
    return `${this.firstName} ${this.lastName}`;
  } else {
    return this.companyName;
  }
});

// Virtual for display name
clientSchema.virtual('displayName').get(function() {
  if (this.type === 'Individual') {
    return `${this.firstName} ${this.lastName}`;
  } else {
    return `${this.companyName} (${this.contactPerson})`;
  }
});

// Virtual for outstanding balance
clientSchema.virtual('outstandingBalance').get(function() {
  return this.totalPurchases - this.totalPayments;
});

// Virtual for credit utilization
clientSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return (this.outstandingBalance / this.creditLimit) * 100;
});

// Virtual for full address
clientSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Indexes for better query performance
clientSchema.index({ phone: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ type: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ firstName: 1, lastName: 1 });
clientSchema.index({ companyName: 1 });
clientSchema.index({ createdAt: -1 });
clientSchema.index({ lastPurchaseDate: -1 });
clientSchema.index({ 'businessDetails.gstNumber': 1 });
clientSchema.index({ 'businessDetails.panNumber': 1 });

// Text index for search functionality
clientSchema.index({
  firstName: 'text',
  lastName: 'text',
  companyName: 'text',
  contactPerson: 'text',
  phone: 'text',
  email: 'text',
  notes: 'text',
});

// Pre-save middleware
clientSchema.pre('save', function(next) {
  // Update current balance
  this.currentBalance = this.totalPurchases - this.totalPayments;
  
  // Set first purchase date if this is the first purchase
  if (this.totalPurchases > 0 && !this.firstPurchaseDate) {
    this.firstPurchaseDate = new Date();
  }
  
  next();
});

// Static methods
clientSchema.statics.getClientStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalPurchases: { $sum: '$totalPurchases' },
        totalPayments: { $sum: '$totalPayments' },
      }
    }
  ]);
};

clientSchema.statics.getTopClients = function(limit = 10) {
  return this.aggregate([
    { $match: { status: 'Active' } },
    { $sort: { totalPurchases: -1 } },
    { $limit: limit },
    {
      $project: {
        fullName: {
          $cond: {
            if: { $eq: ['$type', 'Individual'] },
            then: { $concat: ['$firstName', ' ', '$lastName'] },
            else: '$companyName'
          }
        },
        totalPurchases: 1,
        totalPayments: 1,
        outstandingBalance: { $subtract: ['$totalPurchases', '$totalPayments'] },
        phone: 1,
        email: 1,
      }
    }
  ]);
};

// Instance methods
clientSchema.methods.addPurchase = function(amount) {
  this.totalPurchases += amount;
  this.lastPurchaseDate = new Date();
  return this.save();
};

clientSchema.methods.addPayment = function(amount) {
  this.totalPayments += amount;
  return this.save();
};

clientSchema.methods.updateContactDate = function() {
  this.lastContactDate = new Date();
  return this.save();
};

clientSchema.methods.canPurchase = function(amount) {
  const outstandingBalance = this.totalPurchases - this.totalPayments;
  return (outstandingBalance + amount) <= this.creditLimit;
};

module.exports = mongoose.model('Client', clientSchema);
