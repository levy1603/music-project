// routes/songRoutes.js
const express = require("express");
const router  = express.Router();
const {
  getSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
  playSong,
  likeSong,
  getTopSongs,
  getMySongs,
  getAllUploadsAdmin,
  approveSong,
  rejectSong,
} = require("../controllers/songController");

// ✅ Dùng "admin" thay vì "isAdmin"
const { protect, admin } = require("../middleware/auth");
const { uploadSongFiles } = require("../middleware/upload");

/* ─────────────────────────────────────
   ADMIN routes - đặt TRƯỚC /:id
───────────────────────────────────── */
router.get(
  "/admin/uploads",
  protect, admin,        // ✅ sửa isAdmin → admin
  getAllUploadsAdmin
);
router.patch(
  "/admin/uploads/:id/approve",
  protect, admin,        // ✅ sửa isAdmin → admin
  approveSong
);
router.patch(
  "/admin/uploads/:id/reject",
  protect, admin,        // ✅ sửa isAdmin → admin
  rejectSong
);

/* ─────────────────────────────────────
   Static routes - đặt TRƯỚC /:id
───────────────────────────────────── */
router.get("/top",      getTopSongs);
router.get("/my-songs", protect, getMySongs);
router.get("/",         getSongs);

/* ─────────────────────────────────────
   User upload
───────────────────────────────────── */
router.post(
  "/",
  protect,
  uploadSongFiles.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createSong
);

/* ─────────────────────────────────────
   Dynamic /:id routes - đặt CUỐI
───────────────────────────────────── */
router.get   ("/:id",      getSong);
router.put   ("/:id/play", playSong);
router.put   ("/:id/like", protect, likeSong);
router.delete("/:id",      protect, deleteSong);
router.put(
  "/:id",
  protect,
  uploadSongFiles.fields([
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateSong
);

module.exports = router;