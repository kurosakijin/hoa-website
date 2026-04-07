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
    typingThreadId: {
      type: String,
      default: '',
      trim: true,
    },
    typingAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminPresence', adminPresenceSchema);
