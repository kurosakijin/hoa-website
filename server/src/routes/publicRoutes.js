const express = require('express');
const { chatAttachmentUpload } = require('../middleware/upload');
const {
  getPublicBlockLotStatus,
  getPublicOccupancySummary,
  searchResidentInformation,
} = require('../services/hoaService');
const { getLandingPageContent } = require('../services/contentService');
const {
  getResidentChatThread,
  sendResidentChatMessage,
} = require('../services/chatService');
const { parseRequestPayload } = require('../utils/requestPayload');
const { verifyTurnstileToken } = require('../utils/turnstile');

const router = express.Router();

function uploadResidentChatAttachment(request, response, next) {
  chatAttachmentUpload.single('attachmentImage')(request, response, (error) => {
    if (error?.name === 'MulterError' && error?.code === 'LIMIT_FILE_SIZE') {
      error.statusCode = 400;
      error.message = 'Only PNG and JPG images up to 2 MB are allowed for chat attachments.';
    }

    next(error);
  });
}

router.get('/occupancy-summary', async (_request, response, next) => {
  try {
    return response.json(await getPublicOccupancySummary());
  } catch (error) {
    return next(error);
  }
});

router.get('/block-lot-status', async (_request, response, next) => {
  try {
    return response.json(await getPublicBlockLotStatus());
  } catch (error) {
    return next(error);
  }
});

router.get('/landing-page-content', async (_request, response, next) => {
  try {
    return response.json(await getLandingPageContent());
  } catch (error) {
    return next(error);
  }
});

router.get('/resident-search', async (request, response, next) => {
  try {
    await verifyTurnstileToken(request.query.turnstileToken, request.ip);
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

router.post('/chat-message', uploadResidentChatAttachment, async (request, response, next) => {
  try {
    const payload = parseRequestPayload(request);
    await verifyTurnstileToken(payload?.turnstileToken, request.ip);

    return response
      .status(201)
      .json(
        await sendResidentChatMessage(payload?.residentId, payload?.message, {
          attachmentImageFile: request.file,
        })
      );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
