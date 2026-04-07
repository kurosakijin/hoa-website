const Resident = require('../models/Resident');
const ChatThread = require('../models/ChatThread');
const AdminPresence = require('../models/AdminPresence');
const { formatResidentFullName } = require('../utils/middleInitial');

const ADMIN_PRESENCE_KEY = 'primary';
const ADMIN_ONLINE_WINDOW_MS = 90 * 1000;
const ADMIN_TYPING_WINDOW_MS = 5 * 1000;

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeResidentCode(value) {
  return trimValue(value).toUpperCase();
}

function sanitizeMessageBody(value) {
  return trimValue(value).replace(/\s+/g, ' ');
}

function getResidentDisplayName(resident) {
  return formatResidentFullName(resident);
}

function getAdminDisplayName(admin) {
  return trimValue(admin?.name) || process.env.ADMIN_NAME || 'Sitio Hiyas Admin';
}

function truncateMessagePreview(message) {
  return message.length > 120 ? `${message.slice(0, 117)}...` : message;
}

function toPlainMessage(message) {
  return {
    id: message._id.toString(),
    senderRole: message.senderRole,
    senderName: message.senderName,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

function toThreadSummary(thread) {
  return {
    id: thread._id.toString(),
    residentId: thread.resident.toString(),
    residentCode: thread.residentCode,
    residentName: thread.residentName,
    residentProfileImageUrl: thread.residentProfileImageUrl || '',
    unreadForAdmin: thread.unreadForAdmin || 0,
    unreadForResident: thread.unreadForResident || 0,
    lastMessageAt: thread.lastMessageAt ? thread.lastMessageAt.toISOString() : null,
    lastMessageText: thread.lastMessageText || '',
    lastMessageSenderRole: thread.lastMessageSenderRole || '',
    totalMessages: thread.messages.length,
  };
}

function toThreadDetail(thread) {
  return {
    ...toThreadSummary(thread),
    messages: thread.messages
      .slice()
      .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
      .map(toPlainMessage),
  };
}

function isAdminTypingForThread(adminPresence, threadId) {
  if (!adminPresence?.isOnline || !adminPresence?.typingAt || !adminPresence?.typingThreadId || !threadId) {
    return false;
  }

  const typingAt = new Date(adminPresence.typingAt);
  return (
    adminPresence.typingThreadId === String(threadId) &&
    Date.now() - typingAt.getTime() <= ADMIN_TYPING_WINDOW_MS
  );
}

function withResidentThreadStatus(threadPayload, adminPresence) {
  return {
    ...threadPayload,
    isAdminTyping: isAdminTypingForThread(adminPresence, threadPayload.id),
  };
}

function toResidentChatIdentity(resident) {
  return {
    id: resident._id.toString(),
    residentCode: resident.residentCode,
    fullName: getResidentDisplayName(resident),
    profileImageUrl: resident.profileImageUrl || '',
  };
}

function toAdminPresencePayload(presence, fallbackAdminName) {
  const lastSeenAt = presence?.lastSeenAt ? new Date(presence.lastSeenAt) : null;
  const isOnline =
    Boolean(lastSeenAt) && Date.now() - lastSeenAt.getTime() <= ADMIN_ONLINE_WINDOW_MS;
  const typingAt = presence?.typingAt ? new Date(presence.typingAt) : null;

  return {
    adminName: trimValue(presence?.adminName) || fallbackAdminName || process.env.ADMIN_NAME || 'Sitio Hiyas Admin',
    isOnline,
    lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
    typingThreadId: trimValue(presence?.typingThreadId),
    typingAt:
      isOnline && typingAt && Date.now() - typingAt.getTime() <= ADMIN_TYPING_WINDOW_MS
        ? typingAt.toISOString()
        : null,
  };
}

async function getAdminPresenceStatus(fallbackAdminName = '') {
  const presence = await AdminPresence.findOne({ key: ADMIN_PRESENCE_KEY }).lean();
  return toAdminPresencePayload(presence, fallbackAdminName);
}

async function findResidentByCode(residentCode) {
  const normalizedResidentCode = normalizeResidentCode(residentCode);

  if (!normalizedResidentCode) {
    throw new Error('Resident ID is required to open the resident chat.');
  }

  const resident = await Resident.findOne({ residentCode: normalizedResidentCode });

  if (!resident) {
    throw new Error('Resident ID was not found.');
  }

  return resident;
}

async function findThreadByResidentId(residentId) {
  return ChatThread.findOne({ resident: residentId });
}

async function updateThreadReadState(thread, target) {
  if (!thread) {
    return null;
  }

  if (target === 'admin' && thread.unreadForAdmin > 0) {
    thread.unreadForAdmin = 0;
    await thread.save();
  }

  if (target === 'resident' && thread.unreadForResident > 0) {
    thread.unreadForResident = 0;
    await thread.save();
  }

  return thread;
}

async function getResidentChatThread(residentCode) {
  const resident = await findResidentByCode(residentCode);
  const adminPresence = await getAdminPresenceStatus();
  const thread = await updateThreadReadState(
    await findThreadByResidentId(resident._id),
    'resident'
  );

  return {
    resident: toResidentChatIdentity(resident),
    adminPresence,
    thread: withResidentThreadStatus(
      thread
        ? toThreadDetail(thread)
        : {
          id: '',
          residentId: resident._id.toString(),
          residentCode: resident.residentCode,
          residentName: getResidentDisplayName(resident),
          residentProfileImageUrl: resident.profileImageUrl || '',
          unreadForAdmin: 0,
          unreadForResident: 0,
          lastMessageAt: null,
          lastMessageText: '',
          lastMessageSenderRole: '',
          totalMessages: 0,
          messages: [],
        },
      adminPresence
    ),
  };
}

async function ensureResidentChatThread(resident) {
  let thread = await findThreadByResidentId(resident._id);

  if (!thread) {
    thread = await ChatThread.create({
      resident: resident._id,
      residentCode: resident.residentCode,
      residentName: getResidentDisplayName(resident),
      residentProfileImageUrl: resident.profileImageUrl || '',
      lastMessageAt: new Date(),
      messages: [],
    });
  }

  return thread;
}

async function sendResidentChatMessage(residentCode, body) {
  const resident = await findResidentByCode(residentCode);
  const adminPresence = await getAdminPresenceStatus();

  const messageBody = sanitizeMessageBody(body);

  if (!messageBody) {
    throw new Error('Please enter a message before sending.');
  }

  const thread = await ensureResidentChatThread(resident);
  const createdAt = new Date();

  thread.residentCode = resident.residentCode;
  thread.residentName = getResidentDisplayName(resident);
  thread.residentProfileImageUrl = resident.profileImageUrl || '';
  thread.messages.push({
    senderRole: 'resident',
    senderName: getResidentDisplayName(resident),
    body: messageBody,
    createdAt,
  });
  thread.lastMessageAt = createdAt;
  thread.lastMessageText = truncateMessagePreview(messageBody);
  thread.lastMessageSenderRole = 'resident';
  thread.unreadForAdmin = (thread.unreadForAdmin || 0) + 1;
  thread.unreadForResident = 0;

  await thread.save();

  return {
    resident: toResidentChatIdentity(resident),
    adminPresence,
    thread: withResidentThreadStatus(toThreadDetail(thread), adminPresence),
  };
}

async function listAdminChatThreads() {
  const [threads, adminPresence] = await Promise.all([
    ChatThread.find().sort({ lastMessageAt: -1, updatedAt: -1 }),
    getAdminPresenceStatus(),
  ]);

  return {
    adminPresence,
    threads: threads.map(toThreadSummary),
  };
}

async function getAdminChatThread(threadId) {
  const thread = await ChatThread.findById(threadId);

  if (!thread) {
    throw new Error('Chat thread was not found.');
  }

  await updateThreadReadState(thread, 'admin');
  const adminPresence = await getAdminPresenceStatus();

  return {
    adminPresence,
    thread: toThreadDetail(thread),
  };
}

async function sendAdminChatMessage(threadId, body, admin) {
  const thread = await ChatThread.findById(threadId);

  if (!thread) {
    throw new Error('Chat thread was not found.');
  }

  const messageBody = sanitizeMessageBody(body);

  if (!messageBody) {
    throw new Error('Please enter a message before sending.');
  }

  const createdAt = new Date();
  thread.messages.push({
    senderRole: 'admin',
    senderName: getAdminDisplayName(admin),
    body: messageBody,
    createdAt,
  });
  thread.lastMessageAt = createdAt;
  thread.lastMessageText = truncateMessagePreview(messageBody);
  thread.lastMessageSenderRole = 'admin';
  thread.unreadForResident = (thread.unreadForResident || 0) + 1;
  thread.unreadForAdmin = 0;
  await thread.save();

  await AdminPresence.updateOne(
    { key: ADMIN_PRESENCE_KEY },
    {
      $set: {
        adminName: getAdminDisplayName(admin),
        lastSeenAt: new Date(),
        typingThreadId: '',
        typingAt: null,
      },
    },
    { upsert: true }
  );

  return {
    adminPresence: await getAdminPresenceStatus(getAdminDisplayName(admin)),
    thread: toThreadDetail(thread),
  };
}

async function recordAdminPresence(admin) {
  const lastSeenAt = new Date();
  const adminName = getAdminDisplayName(admin);

  await AdminPresence.updateOne(
    { key: ADMIN_PRESENCE_KEY },
    {
      $set: {
        adminName,
        lastSeenAt,
      },
    },
    { upsert: true }
  );

  return getAdminPresenceStatus(adminName);
}

async function clearAdminPresence(admin) {
  const adminName = getAdminDisplayName(admin);

  await AdminPresence.updateOne(
    { key: ADMIN_PRESENCE_KEY },
    {
      $set: {
        adminName,
        lastSeenAt: new Date(0),
        typingThreadId: '',
        typingAt: null,
      },
    },
    { upsert: true }
  );

  return getAdminPresenceStatus(adminName);
}

async function recordAdminTyping(threadId, admin) {
  const adminName = getAdminDisplayName(admin);

  await AdminPresence.updateOne(
    { key: ADMIN_PRESENCE_KEY },
    {
      $set: {
        adminName,
        lastSeenAt: new Date(),
        typingThreadId: String(threadId || ''),
        typingAt: new Date(),
      },
    },
    { upsert: true }
  );

  return getAdminPresenceStatus(adminName);
}

async function clearAdminTyping(threadId, admin) {
  const adminName = getAdminDisplayName(admin);
  const presence = await AdminPresence.findOne({ key: ADMIN_PRESENCE_KEY });

  if (!presence) {
    return getAdminPresenceStatus(adminName);
  }

  if (!threadId || presence.typingThreadId === String(threadId)) {
    presence.adminName = adminName;
    presence.typingThreadId = '';
    presence.typingAt = null;
    await presence.save();
  }

  return getAdminPresenceStatus(adminName);
}

async function clearChatThread(threadId, admin) {
  const thread = await ChatThread.findById(threadId);

  if (!thread) {
    throw new Error('Chat thread was not found.');
  }

  await ChatThread.deleteOne({ _id: thread._id });
  await clearAdminTyping(thread._id.toString(), admin);

  return {
    cleared: true,
    threadId: thread._id.toString(),
    residentCode: thread.residentCode,
  };
}

async function syncResidentChatThread(resident) {
  await ChatThread.updateOne(
    { resident: resident._id },
    {
      $set: {
        residentCode: resident.residentCode,
        residentName: getResidentDisplayName(resident),
        residentProfileImageUrl: resident.profileImageUrl || '',
      },
    }
  );
}

async function deleteResidentChatThread(residentId) {
  await ChatThread.deleteOne({ resident: residentId });
}

module.exports = {
  getResidentChatThread,
  sendResidentChatMessage,
  listAdminChatThreads,
  getAdminChatThread,
  sendAdminChatMessage,
  recordAdminPresence,
  clearAdminPresence,
  recordAdminTyping,
  clearAdminTyping,
  clearChatThread,
  syncResidentChatThread,
  deleteResidentChatThread,
};
