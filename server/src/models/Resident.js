const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema(
  {
    block: { type: String, required: true, trim: true },
    lotNumber: { type: String, required: true, trim: true },
    squareMeters: { type: Number, required: true, default: 60, min: 0 },
    pricePerSquareMeter: { type: Number, default: 0, min: 0 },
    isSpotCash: { type: Boolean, default: false },
    totalBalance: { type: Number, default: 0, min: 0 },
    remainingBalance: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const residentSchema = new mongoose.Schema(
  {
    residentCode: { type: String, required: true, unique: true, index: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Owner', 'Tenant'], default: 'Owner' },
    isActive: { type: Boolean, default: true },
    lots: {
      type: [lotSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one lot is required.',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resident', residentSchema);
