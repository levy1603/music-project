// controllers/playlistController.js
const Playlist = require("../models/Playlist");

// @desc    Lấy tất cả playlist của user
// @route   GET /api/playlists
// @access  Private
const getMyPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .populate("songs", "title artist coverImage duration audioFile") // ✅ Thêm audioFile
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: playlists.length,
      data: playlists,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy playlist public
// @route   GET /api/playlists/public
// @access  Public
const getPublicPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ isPublic: true })
      .populate("owner", "username avatar")
      .populate("songs", "title artist coverImage duration audioFile") // ✅ Thêm audioFile
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: playlists.length,
      data: playlists,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy 1 playlist theo ID
// @route   GET /api/playlists/:id
// @access  Public/Private
const getPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("owner", "username avatar")
      .populate({
        path: "songs",
        select: "title artist coverImage duration audioFile", // ✅ Thêm audioFile
        populate: { path: "uploadedBy", select: "username" },
      });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy playlist",
      });
    }

    // Kiểm tra quyền xem playlist private
    if (
      !playlist.isPublic &&
      (!req.user || playlist.owner._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Playlist này ở chế độ riêng tư",
      });
    }

    res.status(200).json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo playlist mới
// @route   POST /api/playlists
// @access  Private
const createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;

    const playlist = await Playlist.create({
      name,
      description,
      isPublic,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Tạo playlist thành công",
      data: playlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật playlist
// @route   PUT /api/playlists/:id
// @access  Private (owner)
const updatePlaylist = async (req, res, next) => {
  try {
    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy playlist",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa playlist này",
      });
    }

    playlist = await Playlist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật playlist thành công",
      data: playlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa playlist
// @route   DELETE /api/playlists/:id
// @access  Private (owner)
const deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy playlist",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa playlist này",
      });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xóa playlist thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm bài hát vào playlist
// @route   PUT /api/playlists/:id/add-song
// @access  Private (owner)
const addSongToPlaylist = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy playlist",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa playlist này",
      });
    }

    // Kiểm tra bài hát đã có trong playlist chưa
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({
        success: false,
        message: "Bài hát đã có trong playlist",
      });
    }

    playlist.songs.push(songId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(req.params.id)
      .populate("songs", "title artist coverImage duration audioFile"); // ✅ Thêm audioFile

    res.status(200).json({
      success: true,
      message: "Đã thêm bài hát vào playlist",
      data: updatedPlaylist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa bài hát khỏi playlist
// @route   PUT /api/playlists/:id/remove-song
// @access  Private (owner)
const removeSongFromPlaylist = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy playlist",
      });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa playlist này",
      });
    }

    playlist.songs = playlist.songs.filter((s) => s.toString() !== songId);
    await playlist.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa bài hát khỏi playlist",
      data: playlist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPlaylists,
  getPublicPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
};