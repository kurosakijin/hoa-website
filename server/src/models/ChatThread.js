const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ['resident', 'admin'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const chatThreadSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      unique: true,
      index: true,
    },
    residentCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    residentName: {
      type: String,
      required: true,
      trim: true,
    },
    residentProfileImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageText: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageSenderRole: {
      type: String,
      enum: ['resident', 'admin'],
      default: 'resident',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadForAdmin: {
      type: Number,
      default: 0,
      min: 0,
    },
    unreadForResident: {
      type: Number,
      default: 0,
      min: 0,
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatThread', chatThreadSchema);
