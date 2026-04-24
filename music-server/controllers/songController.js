// controllers/songController.js
const Song                = require("../models/Song");
const User                = require("../models/User");
const Playlist            = require("../models/Playlist");
const mm                  = require("music-metadata");
const path                = require("path");
const notificationService = require("../services/notificationService");
const PlayHistory         = require("../models/PlayHistory");

/* ═══════════════════════════════════════════
   HELPER
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

/* ── Parse tags từ request body ── */
const parseTags = (rawTags) => {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) return rawTags.filter(Boolean);
  try {
    const parsed = JSON.parse(rawTags);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    // Nếu là string dạng "tag1,tag2"
    return rawTags.split(",").map((t) => t.trim()).filter(Boolean);
  }
};

/* ═══════════════════════════════════════════
   PUBLIC: Lấy danh sách bài đã duyệt
═══════════════════════════════════════════ */
const getSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      search,
      genre,
      artist,
      tag,
      year,
      album,
      sort,
    } = req.query;

    const query = {
      status: "approved",
      isDeleted: { $ne: true },
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
        { album: { $regex: search, $options: "i" } },
        { featuring: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (genre) query.genre = genre;
    if (artist) query.artist = { $regex: artist, $options: "i" };
    if (album) query.album = { $regex: album, $options: "i" };
    if (tag) query.tags = tag;
    if (year) query.releaseYear = parseInt(year);

    let sortOption = { createdAt: -1 };

    if (sort === "popular") sortOption = { playCount: -1 };
    else if (sort === "likes") sortOption = { likeCount: -1 };
    else if (sort === "title") sortOption = { title: 1 };
    else if (sort === "year") sortOption = { releaseYear: -1 };

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
   PUBLIC: Lấy 1 bài
═══════════════════════════════════════════ */
const getSong = async (req, res, next) => {
  try {
    const song = await Song.findOne({
      _id:       req.params.id,
      status:    "approved",
      isDeleted: { $ne: true },
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

const getSongFilterOptions = async (req, res, next) => {
  try {
    const baseMatch = {
      status: "approved",
      isDeleted: { $ne: true },
    };

    const [years, genres, albums, tagsAgg] = await Promise.all([
      Song.distinct("releaseYear", baseMatch),
      Song.distinct("genre", baseMatch),
      Song.distinct("album", baseMatch),
      Song.aggregate([
        { $match: baseMatch },
        { $unwind: "$tags" },
        { $match: { tags: { $ne: null, $ne: "" } } },
        { $group: { _id: "$tags" } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        years: (years || []).filter(Boolean).sort((a, b) => b - a),
        genres: (genres || []).filter(Boolean).sort(),
        albums: (albums || []).filter(Boolean).sort(),
        tags: tagsAgg.map((t) => t._id).filter(Boolean),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   USER: Upload bài hát
═══════════════════════════════════════════ */
const createSong = async (req, res, next) => {
  try {
    const {
      title, artist, featuring, album, genre, releaseYear, lyrics, lrc, tags: rawTags,
    } = req.body;

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

    const tags = parseTags(rawTags);

    const song = await Song.create({
      title,
      artist,
      featuring:   featuring                || "",
      album:       album                    || "Single",
      genre:       genre                    || "Pop",
      releaseYear: releaseYear
        ? parseInt(releaseYear)
        : new Date().getFullYear(),
      tags,
      lyrics:      lyrics                   || "",
      lrc:         lrc                      || "",
      duration,
      audioFile,
      coverImage,
      videoFile,
      uploadedBy:  req.user._id,
      status:      "pending",
    });

    const populatedSong = await Song.findById(song._id)
      .populate("uploadedBy", "username avatar");

    console.log(`🎤 LRC: ${lrc ? `Có (${lrc.length} ký tự)` : "Không"}`);
    console.log(`🏷️  Tags: ${tags.length > 0 ? tags.join(", ") : "Không có"}`);

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
          hasLRC:     !!lrc,
          hasTags:    tags.length > 0,
        },
      });
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
   USER: Lịch sử upload
═══════════════════════════════════════════ */
const getMySongs = async (req, res, next) => {
  try {
    const songs = await Song.find({
      uploadedBy: req.user._id,
      isDeleted:  { $ne: true },
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
   ADMIN: Tất cả uploads
═══════════════════════════════════════════ */
const getAllUploadsAdmin = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

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
   ADMIN: Duyệt bài
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

    try {
      await notificationService.create({
        recipient: song.uploadedBy._id,
        sender:    req.user._id,
        type:      "song_approved",
        title:     "✅ Bài hát đã được duyệt!",
        message:   `Bài hát "${song.title}" của bạn đã được phê duyệt 🎉`,
        data: {
          songId:     song._id,
          songTitle:  song.title,
          artist:     song.artist,
          coverImage: song.coverImage,
        },
      });
    } catch (notifErr) {
      console.error("⚠️ Lỗi notification approve:", notifErr.message);
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
   ADMIN: Từ chối bài
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

    try {
      await notificationService.create({
        recipient: song.uploadedBy._id,
        sender:    req.user._id,
        type:      "song_rejected",
        title:     "❌ Bài hát bị từ chối",
        message:   `Bài hát "${song.title}" chưa được phê duyệt.`,
        data: {
          songId:       song._id,
          songTitle:    song.title,
          artist:       song.artist,
          coverImage:   song.coverImage,
          rejectReason,
        },
      });
    } catch (notifErr) {
      console.error("⚠️ Lỗi notification reject:", notifErr.message);
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

    // Cho phép update lyrics/lrc không cần check quyền chặt
    const allowedWithoutAuth = ["lyrics", "lrc"];
    const onlyLyricsOrLRC = Object.keys(req.body).every((k) =>
      allowedWithoutAuth.includes(k)
    );

    if (!onlyLyricsOrLRC) {
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

    // Text fields
    if (req.body.title       !== undefined) updateData.title       = req.body.title;
    if (req.body.artist      !== undefined) updateData.artist      = req.body.artist;
    if (req.body.featuring   !== undefined) updateData.featuring   = req.body.featuring;
    if (req.body.album       !== undefined) updateData.album       = req.body.album;
    if (req.body.genre       !== undefined) updateData.genre       = req.body.genre;
    if (req.body.lyrics      !== undefined) updateData.lyrics      = req.body.lyrics;
    if (req.body.lrc         !== undefined) updateData.lrc         = req.body.lrc;

    // Number fields
    if (req.body.releaseYear !== undefined) {
      updateData.releaseYear = parseInt(req.body.releaseYear);
    }

    // Tags
    if (req.body.tags !== undefined) {
      updateData.tags = parseTags(req.body.tags);
    }

    // Files
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
            message: `${req.user.username} đã cập nhật "${song.title}" - cần duyệt lại`,
            data: {
              songId:     song._id,
              songTitle:  song.title,
              artist:     song.artist,
              coverImage: song.coverImage,
            },
          });
        } catch (notifErr) {
          console.error("⚠️ Lỗi notification update:", notifErr.message);
        }
      }
    }

    song = await Song.findByIdAndUpdate(req.params.id, updateData, {
      new:            true,
      runValidators:  true,
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
   USER/ADMIN: Xóa bài
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
    await Playlist.updateMany(
      { songs: req.params.id },
      { $pull: { songs: req.params.id } }
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

    try {
      await PlayHistory.create({
        song:     req.params.id,
        user:     req.user?._id || null,
        playedAt: new Date(),
      });
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
   USER: Like/Unlike
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
        data:    { isLiked: false },
      });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { favorites: songId } });
      await Song.findByIdAndUpdate(songId, { $inc:      { likeCount: 1 } });
      res.status(200).json({
        success: true,
        message: "Đã thích",
        data:    { isLiked: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════
   PUBLIC: Top songs
═══════════════════════════════════════════ */
const getTopSongs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const songs = await Song.find({
      status:    "approved",
      isDeleted: { $ne: true },
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
  getSongFilterOptions,
};
