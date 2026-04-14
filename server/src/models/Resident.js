const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema(
  {
    block: { type: String, required: true, trim: true },
    lotNumber: { type: String, required: true, trim: true },
    squareMeters: { type: Number, required: true, default: 60, min: 0 },
    pricePerSquareMeter: { type: Number, default: 0, min: 0 },
    isSpotCash: { type: Boolean, default: false },
    interestYears: { type: Number, required: true, default: 5, min: 1, max: 5 },
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
    middleName: { type: String, default: '', trim: true },
    lastName: { type: String, required: true, trim: true },
    contactNumber: { type: String, default: '', trim: true },
    address: { type: String, required: true, trim: true },
    profileImageUrl: { type: String, default: '', trim: true },
    profileImagePublicId: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    lots: {
      type: [lotSchema],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value),
        message: 'Lots must be stored as an array.',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resident', residentSchema);
