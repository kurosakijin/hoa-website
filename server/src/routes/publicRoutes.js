const express = require('express');
const { getPublicOccupancySummary, searchResidentInformation } = require('../services/hoaService');
const {
  getResidentChatThread,
  sendResidentChatMessage,
} = require('../services/chatService');

const router = express.Router();

router.get('/occupancy-summary', async (_request, response, next) => {
  try {
    return response.json(await getPublicOccupancySummary());
  } catch (error) {
    return next(error);
  }
});

router.get('/resident-search', async (request, response, next) => {
  try {
    const result = await searchResidentInformation(request.query);

    if (!result) {
      return response.status(404).json({
        message: 'No resident record matched the provided details.',
      });
    }

    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get('/chat-thread', async (request, response, next) => {
  try {
    return response.json(await getResidentChatThread(request.query.residentId));
  } catch (error) {
    return next(error);
  }
});

router.post('/chat-message', async (request, response, next) => {
  try {
    return response
      .status(201)
      .json(await sendResidentChatMessage(request.body?.residentId, request.body?.message));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
