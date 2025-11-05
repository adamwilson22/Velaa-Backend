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
  // registrationNumber removed from minimal UI flow

// Vehicle Details (UI fields only)
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters'],
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
  mileage: { type: Number, min: [0, 'Mileage cannot be negative'], default: 0 },

  // Ownership & Client Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Vehicle owner is required'],
  },
  // Vehicle Status (UI: Available / Not available / Sold)
  status: {
    type: String,
    enum: ['Available', 'Reserved', 'Sold'],
    default: 'Available',
  },
  // Financial (UI: Asking price / Starting from)
  marketValue: { type: Number, min: [0, 'Market value cannot be negative'], default: 0 },

  // Dates
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  bondExpiryDate: { type: Date },

  // Location & Storage
  // UI toggles
  isActive: { type: Boolean, default: true },
  showInMarketplace: { type: Boolean, default: false },
  monthlyFee: { type: Number, min: 0, default: 0 },

  // Images and Documents
  images: [{
    url: { type: String, required: true },
    caption: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  }],
  // Removed document/defect/maintenance to match UI

  // Metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  // Notes removed to match UI
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional for API testing
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

// Virtual for primary image (guard when images not selected)
vehicleSchema.virtual('primaryImage').get(function() {
  const imgs = Array.isArray(this.images) ? this.images : [];
  const primary = imgs.find(img => img.isPrimary);
  return primary ? primary.url : (imgs.length > 0 ? imgs[0].url : null);
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
// registrationNumber index removed
vehicleSchema.index({ brand: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ purchaseDate: -1 });
vehicleSchema.index({ 'location.warehouse': 1 });

// Text index for search functionality (limited to fields we keep)
vehicleSchema.index({
  chassisNumber: 'text',
  engineNumber: 'text',
  brand: 'text',
  color: 'text',
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
