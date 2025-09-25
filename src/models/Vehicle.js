const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Basic Vehicle Information
  chassisNumber: {
    type: String,
    required: [true, 'Chassis number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-HJ-NPR-Z0-9]{17}$/, 'Please enter a valid 17-character chassis number'],
  },
  engineNumber: {
    type: String,
    required: [true, 'Engine number is required'],
    trim: true,
    uppercase: true,
  },
  registrationNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true, // Allows multiple null values but unique non-null values
  },

  // Vehicle Details
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters'],
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    maxlength: [50, 'Model name cannot exceed 50 characters'],
  },
  variant: {
    type: String,
    trim: true,
    maxlength: [50, 'Variant cannot exceed 50 characters'],
  },
  year: {
    type: Number,
    required: [true, 'Manufacturing year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true,
    maxlength: [30, 'Color cannot exceed 30 characters'],
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'],
  },
  transmission: {
    type: String,
    required: [true, 'Transmission type is required'],
    enum: ['Manual', 'Automatic', 'CVT', 'AMT'],
  },

  // Technical Specifications
  engineCapacity: {
    type: Number,
    min: [0, 'Engine capacity cannot be negative'],
  },
  mileage: {
    type: Number,
    min: [0, 'Mileage cannot be negative'],
  },
  seatingCapacity: {
    type: Number,
    min: [1, 'Seating capacity must be at least 1'],
    max: [50, 'Seating capacity cannot exceed 50'],
  },

  // Ownership & Client Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Vehicle owner is required'],
  },
  ownershipType: {
    type: String,
    enum: ['Individual', 'Company', 'Partnership', 'Trust'],
    default: 'Individual',
  },

  // Vehicle Status
  status: {
    type: String,
    enum: ['Available', 'Sold', 'Reserved', 'Under Maintenance', 'Damaged', 'Scrapped'],
    default: 'Available',
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
    required: [true, 'Vehicle condition is required'],
  },

  // Financial Information
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative'],
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative'],
  },
  marketValue: {
    type: Number,
    min: [0, 'Market value cannot be negative'],
  },

  // Dates
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
  },
  saleDate: {
    type: Date,
  },
  registrationDate: {
    type: Date,
  },
  insuranceExpiryDate: {
    type: Date,
  },
  pucExpiryDate: {
    type: Date,
  },

  // Location & Storage
  location: {
    warehouse: {
      type: String,
      required: [true, 'Warehouse location is required'],
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    row: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
  },

  // Images and Documents
  images: [{
    url: { type: String, required: true },
    caption: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  }],
  documents: [{
    type: {
      type: String,
      enum: ['RC', 'Insurance', 'PUC', 'Invoice', 'NOC', 'Other'],
      required: true,
    },
    url: { type: String, required: true },
    expiryDate: { type: Date },
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Additional Information
  features: [{
    type: String,
    trim: true,
  }],
  defects: [{
    description: { type: String, required: true, trim: true },
    severity: { 
      type: String, 
      enum: ['Minor', 'Major', 'Critical'], 
      default: 'Minor' 
    },
    estimatedCost: { type: Number, min: 0 },
    reportedAt: { type: Date, default: Date.now },
  }],
  
  // Maintenance History
  maintenanceHistory: [{
    date: { type: Date, required: true },
    type: { 
      type: String, 
      enum: ['Service', 'Repair', 'Inspection', 'Cleaning'],
      required: true 
    },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, min: 0 },
    performedBy: { type: String, trim: true },
    nextServiceDue: { type: Date },
  }],

  // Metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

// Virtual for vehicle age
vehicleSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

// Virtual for primary image
vehicleSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for days in inventory
vehicleSchema.virtual('daysInInventory').get(function() {
  const purchaseDate = this.purchaseDate || this.createdAt;
  const endDate = this.saleDate || new Date();
  return Math.floor((endDate - purchaseDate) / (1000 * 60 * 60 * 24));
});

// Virtual for profit/loss
vehicleSchema.virtual('profitLoss').get(function() {
  if (this.sellingPrice && this.purchasePrice) {
    return this.sellingPrice - this.purchasePrice;
  }
  return null;
});

// Indexes for better query performance
vehicleSchema.index({ chassisNumber: 1 });
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ brand: 1, model: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ purchaseDate: -1 });
vehicleSchema.index({ 'location.warehouse': 1 });

// Text index for search functionality
vehicleSchema.index({
  chassisNumber: 'text',
  engineNumber: 'text',
  registrationNumber: 'text',
  brand: 'text',
  model: 'text',
  variant: 'text',
  color: 'text',
  notes: 'text',
});

// Pre-save middleware
vehicleSchema.pre('save', function(next) {
  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    let primaryCount = 0;
    this.images.forEach(img => {
      if (img.isPrimary) primaryCount++;
    });
    
    if (primaryCount === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryCount > 1) {
      let firstPrimary = true;
      this.images.forEach(img => {
        if (img.isPrimary && firstPrimary) {
          firstPrimary = false;
        } else if (img.isPrimary) {
          img.isPrimary = false;
        }
      });
    }
  }
  
  next();
});

// Static methods
vehicleSchema.statics.getVehicleStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$purchasePrice' },
      }
    }
  ]);
};

vehicleSchema.statics.getBrandStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$brand',
        count: { $sum: 1 },
        avgPrice: { $avg: '$purchasePrice' },
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Instance methods
vehicleSchema.methods.addMaintenanceRecord = function(record) {
  this.maintenanceHistory.push(record);
  return this.save();
};

vehicleSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  return this.save();
};

module.exports = mongoose.model('Vehicle', vehicleSchema);
