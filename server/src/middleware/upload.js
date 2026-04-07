const multer = require('multer');

function createFileValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function createImageUpload({ fileSize, allowedMimeTypes, errorMessage }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize,
    },
    fileFilter: (_request, file, callback) => {
      const mimeType = String(file.mimetype || '').toLowerCase();

      if (allowedMimeTypes ? allowedMimeTypes.includes(mimeType) : mimeType.startsWith('image/')) {
        callback(null, true);
        return;
      }

      callback(createFileValidationError(errorMessage));
    },
  });
}

const upload = createImageUpload({
  fileSize: 5 * 1024 * 1024,
  errorMessage: 'Only image uploads are allowed.',
});

const chatAttachmentUpload = createImageUpload({
  fileSize: 2 * 1024 * 1024,
  allowedMimeTypes: ['image/png', 'image/jpeg'],
  errorMessage: 'Only PNG and JPG images up to 2 MB are allowed for chat attachments.',
});

module.exports = {
  chatAttachmentUpload,
  upload,
};
