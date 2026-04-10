// routes/userRoutes.js
const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const {
  getFavorites,
  updateProfile,
  updateAvatar,
  getAllUsers,
  deleteUser,
  updateUserRole, // ✅
  toggleBanUser,  // ✅
  getStats,       // ✅
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/auth");

// ===== MULTER CONFIG =====
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/avatars");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Chỉ chấp nhận file ảnh!"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ===== USER ROUTES =====
router.get("/favorites", protect, getFavorites);
router.put("/profile",   protect, updateProfile);
router.put("/avatar",    protect, uploadAvatar.single("avatar"), updateAvatar);

// ===== ADMIN ROUTES =====
router.get("/stats",           protect, admin, getStats);       // ✅
router.get("/",                protect, admin, getAllUsers);
router.delete("/:id",          protect, admin, deleteUser);
router.put("/:id/role",        protect, admin, updateUserRole); // ✅
router.put("/:id/ban",         protect, admin, toggleBanUser);  // ✅

module.exports = router;