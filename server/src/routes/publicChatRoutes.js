const express = require('express');
const {
  getResidentChatThread,
  sendResidentChatMessage,
} = require('../services/chatService');

const router = express.Router();

router.get('/thread', async (request, response, next) => {
  try {
    return response.json(await getResidentChatThread(request.query.residentId));
  } catch (error) {
    return next(error);
  }
});

router.post('/messages', async (request, response, next) => {
  try {
    return response
      .status(201)
      .json(await sendResidentChatMessage(request.body?.residentId, request.body?.message));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
