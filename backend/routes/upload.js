const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const { uploadImage } = require('../config/cloudinary');

const router = express.Router();

/**
 * POST /api/upload/photos
 * Upload multiple photos to Cloudinary
 * Protected route - requires authentication
 */
router.post('/photos', authenticateToken, uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one image file'
      });
    }

    const uploadedPhotos = [];

    // Upload each file to Cloudinary
    for (const file of req.files) {
      try {
        const result = await uploadImage(file.buffer, {
          folder: 'ucr-housing/listings',
          public_id: `${req.landlord._id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
        });

        uploadedPhotos.push({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height
        });
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Continue with other files even if one fails
      }
    }

    if (uploadedPhotos.length === 0) {
      return res.status(500).json({
        error: 'Upload failed',
        message: 'Failed to upload any images. Please try again.'
      });
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedPhotos.length} photo(s)`,
      photos: uploadedPhotos
    });

  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'An error occurred while uploading images'
    });
  }
});

module.exports = router;

