// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo thư mục nếu chưa có
const createDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

createDir("uploads/songs");
createDir("uploads/covers");
createDir("uploads/videos"); // ✅ THÊM MỚI

// ===== STORAGE =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") {
      cb(null, "uploads/songs/");
    } else if (file.fieldname === "cover") {
      cb(null, "uploads/covers/");
    } else if (file.fieldname === "video") {
      cb(null, "uploads/videos/"); // ✅ THÊM MỚI
    }
  },
  filename: (req, file, cb) => {
    const prefix =
      file.fieldname === "audio" ? "song"
      : file.fieldname === "cover" ? "cover"
      : "video"; // ✅ THÊM MỚI
    const uniqueName = `${prefix}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ===== FILE FILTER =====
const fileFilter = (req, file, cb) => {
  // Audio
  if (file.fieldname === "audio") {
    const allowed = ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp3", "audio/ogg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file nhạc (MP3, WAV, FLAC, OGG)"), false);
    }
  }
  // Cover
  else if (file.fieldname === "cover") {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)"), false);
    }
  }
  // ✅ Video
  else if (file.fieldname === "video") {
    const allowed = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file video (MP4, WEBM, OGG, MOV, AVI)"), false);
    }
  }
  else {
    cb(new Error("File không hợp lệ"), false);
  }
};

// ===== UPLOAD CONFIG =====
const uploadSongFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // ✅ Tăng lên 200MB cho video
  },
});

module.exports = { uploadSongFiles };