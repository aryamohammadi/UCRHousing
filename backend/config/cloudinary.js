const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {Buffer|String} file - File buffer or file path
 * @param {Object} options - Upload options
 * @returns {Promise} Cloudinary upload result
 */
async function uploadImage(file, options = {}) {
  try {
    const uploadOptions = {
      folder: 'ucr-housing/listings',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    // If file is a buffer (from multer), use upload_stream
    if (Buffer.isBuffer(file)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file);
      });
    }

    // If file is a path string, use upload
    return await cloudinary.uploader.upload(file, uploadOptions);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise} Deletion result
 */
async function deleteImage(publicId) {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};

