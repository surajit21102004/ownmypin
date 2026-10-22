const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const { uploadImage } = require('../controllers/upload.controller');

const router = express.Router();

// Temporary storage for multer
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

router.post('/', upload.single('image'), uploadImage);

module.exports = router;
