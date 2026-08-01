/*
  middleware/upload.js — MULTER FILE UPLOAD

  Catches uploaded files before they reach the controller.
  Stores in memory (not disk) because the file is only passing
  through on its way to Supabase Storage.

  memoryStorage → file lands in req.file.buffer
  limits        → reject anything over 5MB
  fileFilter    → images only
*/

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true); // accept
    } else {
      cb(new Error("Only image files are allowed"), false); // reject
    }
  },
});

module.exports = upload;
