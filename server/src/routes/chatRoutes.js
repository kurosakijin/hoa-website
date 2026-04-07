const express = require('express');
const {
  clearAdminTyping,
  clearAdminPresence,
  clearChatThread,
  getAdminChatThread,
  listAdminChatThreads,
  recordAdminTyping,
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

router.delete('/threads/:threadId', async (request, response, next) => {
  try {
    return response.json(await clearChatThread(request.params.threadId, request.admin));
  } catch (error) {
    return next(error);
  }
});

router.post('/typing', async (request, response, next) => {
  try {
    return response.json(await recordAdminTyping(request.body?.threadId, request.admin));
  } catch (error) {
    return next(error);
  }
});

router.post('/typing/stop', async (request, response, next) => {
  try {
    return response.json(await clearAdminTyping(request.body?.threadId, request.admin));
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
