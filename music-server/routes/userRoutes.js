// routes/userRoutes.js
const express          = require("express");
const router           = express.Router();
const {
  getFavorites,
  updateProfile,
  updateAvatar,
  getAllUsers,
  deleteUser,
  updateUserRole,
  toggleBanUser,
  getStats,
} = require("../controllers/userController");
const { protect, admin }   = require("../middleware/auth");
const { uploadAvatar }     = require("../middleware/upload"); 

// ===== USER ROUTES =====
router.get("/favorites", protect,                                    getFavorites);
router.put("/profile",   protect,                                    updateProfile);
router.put("/avatar",    protect, uploadAvatar.single("avatar"),     updateAvatar); // ✅

// ===== ADMIN ROUTES =====
router.get("/stats",     protect, admin,                             getStats);
router.get("/",          protect, admin,                             getAllUsers);
router.delete("/:id",    protect, admin,                             deleteUser);
router.put("/:id/role",  protect, admin,                             updateUserRole);
router.put("/:id/ban",   protect, admin,                             toggleBanUser);

module.exports = router;