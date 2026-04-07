const express = require('express');
const { chatAttachmentUpload } = require('../middleware/upload');
const { parseRequestPayload } = require('../utils/requestPayload');
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

function uploadAdminChatAttachment(request, response, next) {
  chatAttachmentUpload.single('attachmentImage')(request, response, (error) => {
    if (error?.name === 'MulterError' && error?.code === 'LIMIT_FILE_SIZE') {
      error.statusCode = 400;
      error.message = 'Only PNG and JPG images up to 2 MB are allowed for chat attachments.';
    }

    next(error);
  });
}

router.get('/threads', async (_request, response, next) => {
  try {
    return response.json(await listAdminChatThreads());
  } catch (error) {
    return next(error);
  }
});

router.get('/thread', async (request, response, next) => {
  try {
    return response.json(await getAdminChatThread(request.query.threadId));
  } catch (error) {
    return next(error);
  }
});

router.post('/message', uploadAdminChatAttachment, async (request, response, next) => {
  try {
    const payload = parseRequestPayload(request);

    return response.status(201).json(
      await sendAdminChatMessage(payload?.threadId, payload?.message, request.admin, {
        attachmentImageFile: request.file,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/clear-thread', async (request, response, next) => {
  try {
    return response.json(await clearChatThread(request.body?.threadId, request.admin));
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

router.post('/typing-stop', async (request, response, next) => {
  try {
    return response.json(await clearAdminTyping(request.body?.threadId, request.admin));
  } catch (error) {
    return next(error);
  }
});

router.post('/presence-heartbeat', async (request, response, next) => {
  try {
    return response.json(await recordAdminPresence(request.admin));
  } catch (error) {
    return next(error);
  }
});

router.post('/presence-offline', async (request, response, next) => {
  try {
    return response.json(await clearAdminPresence(request.admin));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
