const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  // Invoice Information
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  invoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required'],
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  
  // Client Information
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required'],
  },
  
  // Vehicle Information
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  
  // Transaction Type
  transactionType: {
    type: String,
    enum: ['Sale', 'Purchase', 'Service', 'Rental', 'Insurance', 'Other'],
    required: [true, 'Transaction type is required'],
    default: 'Sale',
  },
  
  // Financial Details
  baseAmount: {
    type: Number,
    required: [true, 'Base amount is required'],
    min: [0, 'Base amount cannot be negative'],
  },
  
  // Tax Information
  taxes: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Tax amount cannot be negative'],
    },
  }],
  
  // Additional Charges
  additionalCharges: [{
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['Charge', 'Discount'],
      default: 'Charge',
    },
  }],
  
  // Calculated Amounts
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative'],
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative'],
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
  },
  balanceAmount: {
    type: Number,
    default: 0,
  },
  
  // Payment Information
  payments: [{
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card', 'Other'],
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Payment notes cannot exceed 500 characters'],
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Cleared', 'Bounced', 'Cancelled'],
      default: 'Cleared',
    },
  }],
  
  // Status Information
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled', 'Refunded'],
    default: 'Draft',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
    default: 'Pending',
  },
  
  // Terms and Conditions
  terms: {
    type: String,
    trim: true,
    maxlength: [1000, 'Terms cannot exceed 1000 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  
  // Document Information
  documents: [{
    type: {
      type: String,
      enum: ['Invoice', 'Receipt', 'Agreement', 'Other'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Recurrence helpers (for monthly invoices)
  billingPeriod: { // 'YYYY-MM'
    type: String,
    required: [true, 'Billing period is required']
  },
  cycleAnchorDay: { // 1..28 recommended
    type: Number,
    default: 1,
    min: 1,
    max: 28
  },
  
  // Reminder Information
  reminders: [{
    sentDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['Email', 'SMS', 'Phone', 'WhatsApp'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Failed'],
      default: 'Sent',
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }],
  
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

// Virtual for days overdue
billingSchema.virtual('daysOverdue').get(function() {
  if (this.paymentStatus === 'Paid' || this.status === 'Paid') {
    return 0;
  }
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today > dueDate) {
    return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  }
  
  return 0;
});

// Virtual for is overdue
billingSchema.virtual('isOverdue').get(function() {
  return this.daysOverdue > 0 && this.paymentStatus !== 'Paid';
});

// Virtual for payment completion percentage
billingSchema.virtual('paymentPercentage').get(function() {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.paidAmount / this.totalAmount) * 100);
});

// Indexes for better query performance
billingSchema.index({ invoiceNumber: 1 });
billingSchema.index({ client: 1 });
billingSchema.index({ vehicle: 1 });
billingSchema.index({ status: 1 });
billingSchema.index({ paymentStatus: 1 });
billingSchema.index({ invoiceDate: -1 });
billingSchema.index({ dueDate: 1 });
billingSchema.index({ createdAt: -1 });
billingSchema.index({ transactionType: 1 });
billingSchema.index({ vehicle: 1, transactionType: 1, billingPeriod: 1 }, { unique: true });

// Compound indexes
billingSchema.index({ client: 1, status: 1 });
billingSchema.index({ paymentStatus: 1, dueDate: 1 });

// Pre-save middleware
billingSchema.pre('save', function(next) {
  // Calculate tax amount
  this.taxAmount = this.taxes.reduce((total, tax) => total + tax.amount, 0);
  
  // Calculate additional charges and discounts
  let additionalChargesTotal = 0;
  let discountTotal = 0;
  
  this.additionalCharges.forEach(charge => {
    if (charge.type === 'Charge') {
      additionalChargesTotal += charge.amount;
    } else {
      discountTotal += Math.abs(charge.amount);
    }
  });
  
  this.discountAmount = discountTotal;
  
  // Calculate total amount
  this.totalAmount = this.baseAmount + this.taxAmount + additionalChargesTotal - discountTotal;
  
  // Calculate paid amount from payments
  this.paidAmount = this.payments
    .filter(payment => payment.status === 'Cleared')
    .reduce((total, payment) => total + payment.amount, 0);
  
  // Calculate balance amount
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status
  if (this.paidAmount === 0) {
    this.paymentStatus = 'Pending';
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'Paid';
    this.status = 'Paid';
  } else {
    this.paymentStatus = 'Partial';
    this.status = 'Partially Paid';
  }
  
  // Check if overdue
  if (this.paymentStatus !== 'Paid' && new Date() > this.dueDate) {
    this.paymentStatus = 'Overdue';
    this.status = 'Overdue';
  }

  // Backfill billingPeriod if missing
  if (!this.billingPeriod) {
    const basis = this.dueDate || this.invoiceDate || new Date();
    const mm = String(basis.getMonth() + 1).padStart(2, '0');
    this.billingPeriod = `${basis.getFullYear()}-${mm}`;
  }
  
  next();
});

// Pre-save middleware to generate invoice number
billingSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Find the last invoice number for this year-month
      const lastInvoice = await this.constructor
        .findOne({
          invoiceNumber: new RegExp(`^INV-${year}${month}-`)
        })
        .sort({ invoiceNumber: -1 });
      
      let sequence = 1;
      if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      this.invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static methods
billingSchema.statics.getOutstandingBills = function() {
  return this.find({
    paymentStatus: { $in: ['Pending', 'Partial', 'Overdue'] }
  }).populate('client vehicle');
};

billingSchema.statics.getOverdueBills = function() {
  return this.find({
    paymentStatus: 'Overdue',
    dueDate: { $lt: new Date() }
  }).populate('client vehicle');
};

billingSchema.statics.getRevenueStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        invoiceDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'Cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalOutstanding: { $sum: '$balanceAmount' },
        invoiceCount: { $sum: 1 },
      }
    }
  ]);
};

// Instance methods
billingSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  return this.save();
};

billingSchema.methods.sendReminder = function(reminderData) {
  this.reminders.push(reminderData);
  return this.save();
};

billingSchema.methods.markAsPaid = function() {
  this.status = 'Paid';
  this.paymentStatus = 'Paid';
  this.paidAmount = this.totalAmount;
  this.balanceAmount = 0;
  return this.save();
};

billingSchema.methods.cancel = function(reason) {
  this.status = 'Cancelled';
  if (reason) {
    this.notes = (this.notes || '') + `\nCancelled: ${reason}`;
  }
  return this.save();
};

module.exports = mongoose.model('Billing', billingSchema);
