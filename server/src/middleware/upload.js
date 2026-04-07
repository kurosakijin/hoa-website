const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    if (String(file.mimetype || '').startsWith('image/')) {
      callback(null, true);
      return;
    }

    callback(new Error('Only image uploads are allowed.'));
  },
});

module.exports = {
  upload,
};
