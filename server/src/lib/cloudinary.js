const { v2: cloudinary } = require('cloudinary');

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (!hasCloudinaryConfig()) {
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return true;
}

function getFolderPath(folder) {
  const baseFolder = String(process.env.CLOUDINARY_FOLDER || 'sitio-hiyas').trim();
  return folder ? `${baseFolder}/${folder}` : baseFolder;
}

async function uploadImageBuffer(file, folder) {
  if (!file?.buffer?.length) {
    return null;
  }

  if (!configureCloudinary()) {
    throw new Error(
      'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to server/.env.'
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: getFolderPath(folder),
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(file.buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId || !configureCloudinary()) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = {
  hasCloudinaryConfig,
  uploadImageBuffer,
  deleteImage,
};
