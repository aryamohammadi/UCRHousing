const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Middleware for single image upload
const uploadSingle = upload.single('photo');

// Middleware for multiple image uploads
const uploadMultiple = upload.array('photos', 10); // Max 10 photos

module.exports = {
  uploadSingle,
  uploadMultiple,
  upload
};

