/**
 * middleware/upload.js — Middleware do uploadu zdjęć (Multer)
 *
 * Używany w trasach admina do przesyłania zdjęć customowych piłkarzy.
 * Pliki zapisywane są w folderze /uploads/ z losową nazwą.
 *
 * Limit: 5MB, tylko obrazy (jpg, png, webp).
 * Plik po zapisaniu dostępny pod: http://localhost:3001/uploads/<filename>
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upewnij się że folder uploads istnieje
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `player-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone tylko pliki: jpg, jpeg, png, webp'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024,
  },
});

module.exports = upload;
