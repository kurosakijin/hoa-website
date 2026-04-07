const mongoose = require('mongoose');

const adminPresenceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'primary',
      trim: true,
    },
    adminName: {
      type: String,
      default: '',
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminPresence', adminPresenceSchema);
