const mongoose = require('mongoose');
const Resident = require('../models/Resident');
const Payment = require('../models/Payment');
const ChatThread = require('../models/ChatThread');
const AdminPresence = require('../models/AdminPresence');

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured.');
  }

  await mongoose.connect(mongoUri);
  await Resident.syncIndexes();
  await Payment.syncIndexes();
  await ChatThread.syncIndexes();
  await AdminPresence.syncIndexes();
  return mongoose.connection;
}

module.exports = {
  connectDatabase,
};
