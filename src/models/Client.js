const mongoose = require('mongoose');

// Minimal Client schema matching UI: name, phone, type, isActive
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number'],
    unique: true,
  },
  type: {
    type: String,
    enum: ['Individual', 'Dealer', 'Company'],
    required: [true, 'Client type is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

clientSchema.index({ name: 1 });
clientSchema.index({ type: 1 });
clientSchema.index({ isActive: 1 });

module.exports = mongoose.model('Client', clientSchema);
