const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure directories exist
['selfies', 'properties'].forEach((sub) => {
  const p = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
});

/**
 * Upload single image (supports multipart file or base64 JSON payload)
 */
async function uploadImage(req, res, next) {
  try {
    const uploadType = req.body.type === 'selfie' ? 'selfies' : 'properties';
    const targetDir = path.join(UPLOADS_DIR, uploadType);

    // 1. If file uploaded via Multer (multipart/form-data)
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const randomName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      const destPath = path.join(targetDir, randomName);

      fs.renameSync(req.file.path, destPath);

      const fileUrl = `/uploads/${uploadType}/${randomName}`;
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        url: fileUrl,
        filename: randomName,
      });
    }

    // 2. If base64 uploaded via JSON body
    const base64Data = req.body.image || req.body.base64;
    if (base64Data && typeof base64Data === 'string') {
      let ext = '.jpg';
      let cleanData = base64Data;

      if (base64Data.startsWith('data:image/')) {
        const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
        if (matches) {
          ext = matches[1] === 'png' ? '.png' : matches[1] === 'webp' ? '.webp' : '.jpg';
          cleanData = base64Data.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
        }
      }

      const randomName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      const destPath = path.join(targetDir, randomName);

      const buffer = Buffer.from(cleanData, 'base64');
      fs.writeFileSync(destPath, buffer);

      const fileUrl = `/uploads/${uploadType}/${randomName}`;
      return res.status(200).json({
        success: true,
        message: 'Base64 image uploaded successfully',
        url: fileUrl,
        filename: randomName,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'No image file or base64 data provided',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadImage,
};
