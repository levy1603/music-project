const Song      = require("../models/Song");
const SongTrash = require("../models/SongTrash");
const fs        = require("fs");
const path      = require("path");

// ─── Helper: xóa file vật lý ─────────────────────────────────────────────────
const deletePhysicalFile = (filename, subFolder) => {
  // Bỏ qua nếu là default hoặc URL ngoài
  if (!filename) return;
  if (filename === "default-cover.jpg") return;
  if (filename.startsWith("http")) return;

  try {
    const filePath = path.join(
      __dirname, "..", "uploads", subFolder, filename
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Trash] ✅ Deleted: uploads/${subFolder}/${filename}`);
    }
  } catch (err) {
    console.error(`[Trash] ❌ deleteFile error:`, err.message);
  }
};

// ─── GET /api/trash ───────────────────────────────────────────────────────────
// Lấy danh sách nhạc trong thùng rác của user
const getTrash = async (req, res) => {
  try {
    const items = await SongTrash
      .find({ userId: req.user._id })
      .sort({ deletedAt: -1 })
      .lean();

    const now  = Date.now();
    const data = items.map((item) => ({
      ...item,
      secondsLeft: Math.max(
        0,
        Math.floor((new Date(item.expiresAt).getTime() - now) / 1000)
      ),
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("[getTrash]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─── PUT /api/songs/:id/soft-delete ──────────────────────────────────────────
// Chuyển bài hát vào thùng rác (soft delete)
const softDelete = async (req, res) => {
  try {
    const { id }  = req.params;
    const userId  = req.user._id;

    // ✅ Kiểm tra bài thuộc về user và chưa bị xóa
    const song = await Song.findOne({
      _id        : id,
      uploadedBy : userId,
      isDeleted  : false,
    });

    if (!song) {
      return res.status(404).json({
        success : false,
        message : "Không tìm thấy bài hát",
      });
    }

    // ✅ Tạo trash record - snapshot toàn bộ data
    await SongTrash.create({
      originalSongId : song._id,
      userId,
      songData: {
        title      : song.title,
        artist     : song.artist,
        album      : song.album,
        genre      : song.genre,
        audioFile  : song.audioFile,
        coverImage : song.coverImage,
        duration   : song.duration,
        playCount  : song.playCount,
        status     : song.status, // ✅ lưu status để restore đúng
      },
    });

    // ✅ Đánh dấu soft delete
    await Song.findByIdAndUpdate(id, {
      isDeleted : true,
      deletedAt : new Date(),
    });

    res.json({
      success   : true,
      message   : "Đã chuyển vào thùng rác",
      expiresAt : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (err) {
    console.error("[softDelete]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─── PUT /api/trash/:trashId/restore ─────────────────────────────────────────
// Khôi phục bài hát từ thùng rác
const restore = async (req, res) => {
  try {
    const { trashId } = req.params;
    const userId      = req.user._id;

    const trashItem = await SongTrash.findOne({ _id: trashId, userId });
    if (!trashItem) {
      return res.status(404).json({
        success : false,
        message : "Không tìm thấy hoặc đã hết hạn khôi phục",
      });
    }

    // ✅ Kiểm tra song gốc còn tồn tại
    const originalSong = await Song.findById(trashItem.originalSongId);
    if (!originalSong) {
      await SongTrash.findByIdAndDelete(trashId);
      return res.status(404).json({
        success : false,
        message : "Bài hát gốc không còn tồn tại, không thể khôi phục",
      });
    }

    // ✅ Khôi phục
    await Song.findByIdAndUpdate(trashItem.originalSongId, {
      isDeleted : false,
      deletedAt : null,
    });

    // ✅ Xóa khỏi trash
    await SongTrash.findByIdAndDelete(trashId);

    res.json({ success: true, message: "Khôi phục thành công" });
  } catch (err) {
    console.error("[restore]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─── DELETE /api/trash/:trashId/permanent ────────────────────────────────────
// Xóa vĩnh viễn thủ công
const permanentDelete = async (req, res) => {
  try {
    const { trashId } = req.params;
    const userId      = req.user._id;

    const trashItem = await SongTrash.findOne({ _id: trashId, userId });
    if (!trashItem) {
      return res.status(404).json({
        success : false,
        message : "Không tìm thấy",
      });
    }

    // ✅ Xóa file vật lý
    deletePhysicalFile(trashItem.songData.audioFile,  "songs");
    deletePhysicalFile(trashItem.songData.coverImage, "covers");

    // ✅ Xóa song gốc hoàn toàn khỏi DB
    await Song.findByIdAndDelete(trashItem.originalSongId);

    // ✅ Xóa trash record
    await SongTrash.findByIdAndDelete(trashId);

    res.json({ success: true, message: "Đã xóa vĩnh viễn" });
  } catch (err) {
    console.error("[permanentDelete]", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = { getTrash, softDelete, restore, permanentDelete };