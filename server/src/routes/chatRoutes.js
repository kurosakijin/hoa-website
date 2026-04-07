const express = require('express');
const {
  clearAdminPresence,
  getAdminChatThread,
  listAdminChatThreads,
  recordAdminPresence,
  sendAdminChatMessage,
} = require('../services/chatService');

const router = express.Router();

router.get('/threads', async (_request, response, next) => {
  try {
    return response.json(await listAdminChatThreads());
  } catch (error) {
    return next(error);
  }
});

router.get('/threads/:threadId', async (request, response, next) => {
  try {
    return response.json(await getAdminChatThread(request.params.threadId));
  } catch (error) {
    return next(error);
  }
});

router.post('/threads/:threadId/messages', async (request, response, next) => {
  try {
    return response.status(201).json(
      await sendAdminChatMessage(request.params.threadId, request.body?.message, request.admin)
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/presence/heartbeat', async (request, response, next) => {
  try {
    return response.json(await recordAdminPresence(request.admin));
  } catch (error) {
    return next(error);
  }
});

router.post('/presence/offline', async (request, response, next) => {
  try {
    return response.json(await clearAdminPresence(request.admin));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
