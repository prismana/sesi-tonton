const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: ture });
}

const storage = multer.diskStorage({
  destination: (req, res, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    callback(null, 'video-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Format file tidak didukung! Hanya file video (MP4/WebM/OGG) yang diizinkan.'), false);
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // Limit 200 Mb per video
});

module.exports = upload;