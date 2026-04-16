// controllers/userController.js
const User        = require("../models/User");
const Song        = require("../models/Song");
const PlayHistory = require("../models/PlayHistory"); // 👈 THÊM
const path        = require("path");
const fs          = require("fs");

/* ═══════════════════════════════════════════
   Giữ nguyên các function cũ
   getFavorites, updateProfile, updateAvatar,
   getAllUsers, deleteUser, updateUserRole, toggleBanUser
═══════════════════════════════════════════ */

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      populate: { path: "uploadedBy", select: "username avatar" },
    });
    res.status(200).json({
      success: true,
      count: user.favorites.length,
      data:  user.favorites,
    });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, nickname, bio } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tên người dùng không được để trống!",
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        username: username.trim(),
        nickname: nickname?.trim() || "",
        bio:      bio?.trim()      || "",
      },
      { new: true, runValidators: true }
    ).select("-password");

    const uploadCount   = await Song.countDocuments({ uploadedBy: req.user._id });
    const favoriteCount = updatedUser.favorites?.length || 0;

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công!",
      data:    { ...updatedUser.toObject(), uploadCount, favoriteCount },
    });
  } catch (error) { next(error); }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh!" });
    }
    const currentUser = await User.findById(req.user._id);
    if (currentUser.avatar && currentUser.avatar.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(__dirname, "..", currentUser.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const avatarPath  = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Cập nhật avatar thành công!",
      data:    { avatar: avatarPath, user: updatedUser },
    });
  } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password -__v")
      .sort({ createdAt: -1 });

    const usersWithCount = await Promise.all(
      users.map(async (user) => {
        const uploadCount = await Song.countDocuments({ uploadedBy: user._id });
        return { ...user.toObject(), uploadCount };
      })
    );
    res.status(200).json({
      success: true,
      count:   users.length,
      data:    usersWithCount,
    });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Không thể xóa tài khoản Admin!" });
    }
    await Song.deleteMany({ uploadedBy: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role không hợp lệ" });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Không thể đổi role của chính mình!" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.status(200).json({
      success: true,
      message: `Đã ${role === "admin" ? "cấp" : "thu hồi"} quyền Admin`,
      data:    user,
    });
  } catch (error) { next(error); }
};

const toggleBanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Không thể khóa tài khoản Admin!" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: !user.isBanned },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success:  true,
      message:  updatedUser.isBanned ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      data:     updatedUser,
    });
  } catch (error) { next(error); }
};

/* ═══════════════════════════════════════════
   THỐNG KÊ TUẦN (7 ngày gần nhất)
═══════════════════════════════════════════ */
const getDailyStats = async () => {
  const days    = [];
  const now     = new Date();
  const LABELS  = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const MONTHS  = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];

  // ── Tính ngày đầu tuần (Thứ 2) ──
  const startOfWeek  = new Date(now);
  const currentDay   = now.getDay(); // 0=CN
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const startDay = new Date(startOfWeek);
    startDay.setDate(startOfWeek.getDate() + i);
    startDay.setHours(0, 0, 0, 0);

    const endDay = new Date(startDay);
    endDay.setHours(23, 59, 59, 999);

    const dayOfWeek = startDay.getDay();
    const label     = LABELS[dayOfWeek];
    const dateStr   = `${startDay.getDate()}/${MONTHS[startDay.getMonth()]}`;
    const isToday   = startDay.toDateString() === now.toDateString();

    // ✅ Bài hát mới - dùng createdAt (đúng)
    const songsCount = await Song.countDocuments({
      createdAt: { $gte: startDay, $lte: endDay },
      status:    "approved",
    });

    // ✅ User mới - dùng createdAt (đúng)
    const usersCount = await User.countDocuments({
      createdAt: { $gte: startDay, $lte: endDay },
    });

    // ✅ Lượt nghe - dùng PlayHistory.playedAt (ĐÚNG ngày nghe thực tế)
    const playsCount = await PlayHistory.countDocuments({
      playedAt: { $gte: startDay, $lte: endDay },
    });

    days.push({
      day:     `${label}\n${dateStr}`,
      label,
      date:    dateStr,
      songs:   songsCount,
      users:   usersCount,
      plays:   playsCount, // ← Lượt nghe đúng ngày
      isToday,
    });
  }

  return days;
};

/* ═══════════════════════════════════════════
   THỐNG KÊ 12 THÁNG
═══════════════════════════════════════════ */
const getMonthlyStats = async () => {
  const months = [];
  const now    = new Date();

  for (let i = 11; i >= 0; i--) {
    const date       = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endMonth   = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const label = `T${date.getMonth() + 1}`;

    // ✅ Bài hát mới theo tháng
    const songsCount = await Song.countDocuments({
      createdAt: { $gte: startMonth, $lte: endMonth },
      status:    "approved",
    });

    // ✅ User mới theo tháng
    const usersCount = await User.countDocuments({
      createdAt: { $gte: startMonth, $lte: endMonth },
    });

    // ✅ Lượt nghe theo tháng - dùng PlayHistory.playedAt
    const playsCount = await PlayHistory.countDocuments({
      playedAt: { $gte: startMonth, $lte: endMonth },
    });

    months.push({
      month: label,
      songs: songsCount,
      users: usersCount,
      plays: playsCount, // ← Lượt nghe đúng tháng
    });
  }

  return months;
};

/* ═══════════════════════════════════════════
   TỔNG HỢP STATS
═══════════════════════════════════════════ */
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSongs,
      totalAdmins,
      totalPlays,   // ← Đếm từ PlayHistory
      recentSongs,
      recentUsers,
      dailyStats,
      monthlyStats,
    ] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments({ status: "approved" }),
      User.countDocuments({ role: "admin" }),
      PlayHistory.countDocuments(),         // ✅ Tổng lượt nghe từ PlayHistory
      Song.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("uploadedBy", "username"),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("-password"),
      getDailyStats(),
      getMonthlyStats(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSongs,
        totalAdmins,
        totalPlays,
        recentSongs,
        recentUsers,
        dailyStats,
        monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  updateProfile,
  updateAvatar,
  getAllUsers,
  deleteUser,
  updateUserRole,
  toggleBanUser,
  getStats,
};