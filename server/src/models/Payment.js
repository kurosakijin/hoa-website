const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentCode: { type: String, required: true, trim: true },
    residentName: { type: String, required: true, trim: true },
    lotId: { type: String, required: true, index: true },
    block: { type: String, required: true, trim: true },
    lotNumber: { type: String, required: true, trim: true },
    squareMeters: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['Association Dues', 'Special Assessment', 'Penalty', 'Other'],
      default: 'Association Dues',
    },
    method: {
      type: String,
      enum: ['Cash', 'Check', 'GCash', 'Bank Transfer'],
      required: true,
    },
    notes: { type: String, default: '', trim: true },
    paymentDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
