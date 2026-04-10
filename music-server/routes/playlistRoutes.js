// routes/playlistRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMyPlaylists,
  getPublicPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} = require("../controllers/playlistController");
const { protect } = require("../middleware/auth");

// Public
router.get("/public", getPublicPlaylists);
router.get("/:id", getPlaylist);

// Private
router.get("/", protect, getMyPlaylists);
router.post("/", protect, createPlaylist);
router.put("/:id", protect, updatePlaylist);
router.delete("/:id", protect, deletePlaylist);
router.put("/:id/add-song", protect, addSongToPlaylist);
router.put("/:id/remove-song", protect, removeSongFromPlaylist);

module.exports = router;