// controllers/songController.js
const Song                = require("../models/Song");
const User                = require("../models/User");
const mm                  = require("music-metadata");
const path                = require("path");
const notificationService = require("../services/notificationService");
const PlayHistory         = require("../models/PlayHistory")

/* ═══════════════════════════════════════════
   HELPER: Đọc duration từ file audio
═══════════════════════════════════════════ */
const getAudioDuration = async (filename) => {
  try {
    const audioPath = path.join(__dirname, "../uploads/songs", filename);
    const metadata  = await mm.parseFile(audioPath);
    return Math.round(metadata.format.duration || 0);
  } catch (e) {
    console.log("⚠️ Không đọc được duration:", e.message);
    return 0;
  }
};

/* ═══════════════════════════════════════════
   PUBLIC: Chỉ lấy bài đã được duyệt
═══════════════════════════════════════════ */
const getSongs = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // ✅ $ne: true → match cả doc cũ (undefined) lẫn false
    let query = {
      status:    "approved",
      isDeleted: { $ne: true },
    };

    if (req.query.search) {
      query.$or = [
        { title:  { $regex: req.query.search, $options: "i" } },
        { artist: { $regex: req.query.search, $options: "i" } },
        { album:  { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.genre)  query.genre  = req.query.genre;
    if (req.query.artist) query.artist = { $regex: req.query.artist, $options: "i" };

    let sortOption = { createdAt: -1 };
    if (req.query.sort === "popular") sortOption = { playCount: -1 };
    else if (req.query.sort === "likes") sortOption = { likeCount: -1 };
    else if (req.query.sort === "title") sortOption = { title: 1 };

    const total = await Song.countDocuments(query);
    const songs = await Song.find(query)
      .populate("uploadedBy", "username avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: songs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: songs,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   PUBLIC: Lấy 1 bài (chỉ approved)
═══════════════════════════════════════════ */
const getSong = async (req, res, next) => {
  try {
    const song = await Song.findOne({
      _id:       req.params.id,
      status:    "approved",
      isDeleted: { $ne: true }, // ✅
    }).populate("uploadedBy", "username avatar");

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài hát",
      });
    }
    res.status(200).json({ success: true, data: song });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   USER: Upload bài hát → luôn pending
═══════════════════════════════════════════ */
const createSong = async (req, res, next) => {
  try {
    const { title, artist, album, genre, lyrics } = req.body;

    let audioFile  = "";
    let coverImage = "default-cover.jpg";
    let videoFile  = "";
    let duration   = 0;

    if (req.files) {
      if (req.files.audio?.[0]) {
        audioFile = req.files.audio[0].filename;
        duration  = await getAudioDuration(audioFile);
        console.log(`🎵 Duration: ${duration}s`);
      }
      if (req.files.cover?.[0]) coverImage = req.files.cover[0].filename;
      if (req.files.video?.[0]) videoFile  = req.files.video[0].filename;
    }

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file nhạc",
      });
    }

    const song = await Song.create({
      title,
      artist,
      album:      album  || "Single",
      genre:      genre  || "Pop",
      lyrics:     lyrics || "",
      duration,
      audioFile,
      coverImage,
      videoFile,
      uploadedBy: req.user._id,
      status:     "pending",
    });

    const populatedSong = await Song.findById(song._id)
      .populate("uploadedBy", "username avatar");

    try {
      await notificationService.notifyAllAdmins({
        sender:  req.user._id,
        type:    "new_upload",
        title:   "🎵 Bài hát mới chờ duyệt",
        message: `${req.user.username} vừa upload "${title}" (${genre}) - cần phê duyệt`,
        data: {
          songId:     song._id,
          songTitle:  title,
          artist,
          coverImage,
        },
      });
      console.log(`🔔 Đã gửi thông báo upload tới admin: "${title}"`);
    } catch (notifErr) {
      console.error("⚠️ Lỗi gửi notification:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Upload thành công! Bài hát đang chờ Admin duyệt.",
      data: populatedSong,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   USER: Lấy lịch sử upload của mình
   ✅ $ne: true → không mất dữ liệu cũ
═══════════════════════════════════════════ */
const getMySongs = async (req, res, next) => {
  try {
    const songs = await Song.find({
      uploadedBy : req.user._id,
      isDeleted  : { $ne: true }, // ✅ match undefined + false, bỏ qua true
    })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "username avatar")
      .populate("reviewedBy", "username")
      .select("-__v");

    res.status(200).json({
      success: true,
      count: songs.length,
      data: songs,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   ADMIN: Lấy TẤT CẢ uploads (mọi status)
═══════════════════════════════════════════ */
const getAllUploadsAdmin = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Admin thấy tất cả kể cả đã xóa mềm
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const total = await Song.countDocuments(filter);
    const songs = await Song.find(filter)
      .populate("uploadedBy", "username avatar email")
      .populate("reviewedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const stats = await Song.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statsMap = { pending: 0, approved: 0, rejected: 0 };
    stats.forEach((s) => { statsMap[s._id] = s.count; });

    res.status(200).json({
      success: true,
      count: songs.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      stats: statsMap,
      data: songs,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   ADMIN: Duyệt bài hát
═══════════════════════════════════════════ */
const approveSong = async (req, res, next) => {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      {
        status:       "approved",
        reviewedBy:   req.user._id,
        reviewedAt:   new Date(),
        rejectReason: "",
      },
      { new: true }
    )
      .populate("uploadedBy", "username email")
      .populate("reviewedBy", "username");

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài hát",
      });
    }

    console.log(`✅ Admin ${req.user.username} đã duyệt: "${song.title}"`);

    try {
      await notificationService.create({
        recipient: song.uploadedBy._id,
        sender:    req.user._id,
        type:      "song_approved",
        title:     "✅ Bài hát đã được duyệt!",
        message:   `Bài hát "${song.title}" của bạn đã được phê duyệt và công khai trên MusicVN 🎉`,
        data: {
          songId:     song._id,
          songTitle:  song.title,
          artist:     song.artist,
          coverImage: song.coverImage,
        },
      });
      console.log(`🔔 Đã thông báo duyệt tới user: ${song.uploadedBy.username}`);
    } catch (notifErr) {
      console.error("⚠️ Lỗi gửi notification approve:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Đã duyệt bài "${song.title}"`,
      data: song,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   ADMIN: Từ chối bài hát
═══════════════════════════════════════════ */
const rejectSong = async (req, res, next) => {
  try {
    const { reason }   = req.body;
    const rejectReason = reason || "Không đáp ứng tiêu chuẩn";

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      {
        status:       "rejected",
        reviewedBy:   req.user._id,
        reviewedAt:   new Date(),
        rejectReason,
      },
      { new: true }
    )
      .populate("uploadedBy", "username email")
      .populate("reviewedBy", "username");

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài hát",
      });
    }

    console.log(`❌ Admin ${req.user.username} đã từ chối: "${song.title}"`);

    try {
      await notificationService.create({
        recipient: song.uploadedBy._id,
        sender:    req.user._id,
        type:      "song_rejected",
        title:     "❌ Bài hát bị từ chối",
        message:   `Bài hát "${song.title}" của bạn chưa được phê duyệt.`,
        data: {
          songId:       song._id,
          songTitle:    song.title,
          artist:       song.artist,
          coverImage:   song.coverImage,
          rejectReason,
        },
      });
      console.log(`🔔 Đã thông báo từ chối tới user: ${song.uploadedBy.username}`);
    } catch (notifErr) {
      console.error("⚠️ Lỗi gửi notification reject:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Đã từ chối bài "${song.title}"`,
      data: song,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   USER/ADMIN: Update bài hát
═══════════════════════════════════════════ */
const updateSong = async (req, res, next) => {
  try {
    let song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài hát",
      });
    }

    const onlyLyrics =
      Object.keys(req.body).length === 1 && req.body.lyrics !== undefined;

    if (!onlyLyrics) {
      if (
        song.uploadedBy.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa bài hát này",
        });
      }
    }

    const updateData = {};
    if (req.body.title)                updateData.title  = req.body.title;
    if (req.body.artist)               updateData.artist = req.body.artist;
    if (req.body.album)                updateData.album  = req.body.album;
    if (req.body.genre)                updateData.genre  = req.body.genre;
    if (req.body.lyrics !== undefined) updateData.lyrics = req.body.lyrics;

    if (req.files?.cover?.[0]) updateData.coverImage = req.files.cover[0].filename;
    if (req.files?.video?.[0]) updateData.videoFile  = req.files.video[0].filename;

    if (req.files?.audio?.[0]) {
      updateData.audioFile = req.files.audio[0].filename;
      updateData.duration  = await getAudioDuration(updateData.audioFile);

      if (req.user.role !== "admin") {
        updateData.status       = "pending";
        updateData.reviewedBy   = null;
        updateData.reviewedAt   = null;
        updateData.rejectReason = "";

        try {
          await notificationService.notifyAllAdmins({
            sender:  req.user._id,
            type:    "new_upload",
            title:   "🔄 Bài hát được cập nhật - chờ duyệt lại",
            message: `${req.user.username} đã cập nhật file nhạc "${song.title}" - cần duyệt lại`,
            data: {
              songId:     song._id,
              songTitle:  song.title,
              artist:     song.artist,
              coverImage: song.coverImage,
            },
          });
        } catch (notifErr) {
          console.error("⚠️ Lỗi gửi notification update:", notifErr.message);
        }
      }
    }

    song = await Song.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("uploadedBy", "username avatar");

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: song,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   USER/ADMIN: Xoá bài hát (hard delete)
═══════════════════════════════════════════ */
const deleteSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài hát",
      });
    }

    if (
      song.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bài hát này",
      });
    }

    await Song.findByIdAndDelete(req.params.id);
    await User.updateMany(
      { favorites: req.params.id },
      { $pull: { favorites: req.params.id } }
    );

    res.status(200).json({
      success: true,
      message: "Xóa bài hát thành công",
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   PUBLIC: Play song
═══════════════════════════════════════════ */
const playSong = async (req, res, next) => {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    );

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài hát",
      });
    }

    // ✅ Lưu PlayHistory - tách try/catch riêng
    // để lỗi history không ảnh hưởng response chính
    try {
      await PlayHistory.create({
        song:     req.params.id,
        user:     req.user?._id || null,
        playedAt: new Date(),
      });
      console.log(`🎵 Ghi lượt nghe: "${song.title}" | user: ${req.user?._id || "anonymous"}`);
    } catch (historyErr) {
      console.error("⚠️ Lỗi lưu PlayHistory:", historyErr.message);
    }

    res.status(200).json({
      success: true,
      data: { playCount: song.playCount },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   USER: Like/Unlike song
═══════════════════════════════════════════ */
const likeSong = async (req, res, next) => {
  try {
    const songId = req.params.id;
    const userId = req.user._id;
    const song   = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài hát",
      });
    }

    const user    = await User.findById(userId);
    const isLiked = user.favorites.includes(songId);

    if (isLiked) {
      await User.findByIdAndUpdate(userId, { $pull:     { favorites: songId } });
      await Song.findByIdAndUpdate(songId, { $inc:      { likeCount: -1 } });
      res.status(200).json({
        success: true,
        message: "Đã bỏ thích",
        data: { isLiked: false },
      });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { favorites: songId } });
      await Song.findByIdAndUpdate(songId, { $inc:      { likeCount: 1 } });
      res.status(200).json({
        success: true,
        message: "Đã thích bài hát",
        data: { isLiked: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   PUBLIC: Top songs (chỉ approved)
═══════════════════════════════════════════ */
const getTopSongs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const songs = await Song.find({
      status:    "approved",
      isDeleted: { $ne: true }, // ✅
    })
      .populate("uploadedBy", "username avatar")
      .sort({ playCount: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: songs.length,
      data: songs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};