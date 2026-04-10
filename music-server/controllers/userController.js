// controllers/userController.js
const User = require("../models/User");
const Song = require("../models/Song");
const path = require("path");
const fs   = require("fs");

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      populate: { path: "uploadedBy", select: "username avatar" },
    });
    res.status(200).json({
      success: true,
      count: user.favorites.length,
      data: user.favorites,
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
      { username: username.trim(), nickname: nickname?.trim() || "", bio: bio?.trim() || "" },
      { new: true, runValidators: true }
    ).select("-password");

    const uploadCount   = await Song.countDocuments({ uploadedBy: req.user._id });
    const favoriteCount = updatedUser.favorites?.length || 0;

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công!",
      data: { ...updatedUser.toObject(), uploadCount, favoriteCount },
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
      data: { avatar: avatarPath, user: updatedUser },
    });
  } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -__v").sort({ createdAt: -1 });
    const usersWithCount = await Promise.all(
      users.map(async (user) => {
        const uploadCount = await Song.countDocuments({ uploadedBy: user._id });
        return { ...user.toObject(), uploadCount };
      })
    );
    res.status(200).json({
      success: true,
      count: users.length,
      data: usersWithCount,
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
      data: user,
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
      success: true,
      message: updatedUser.isBanned ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      data: updatedUser,
    });
  } catch (error) { next(error); }
};
const getDailyStats = async () => {
  const days  = [];
  const now   = new Date();
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Lấy ngày đầu tuần (Thứ 2)
  const startOfWeek = new Date(now);
  const day = now.getDay(); // 0 = CN, 1 = T2, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Lặp 7 ngày từ T2 → CN
  for (let i = 0; i < 7; i++) {
    const startDay = new Date(startOfWeek);
    startDay.setDate(startOfWeek.getDate() + i);

    const endDay = new Date(startDay);
    endDay.setDate(startDay.getDate() + 1);

    const dayOfWeek = startDay.getDay(); // 0=CN, 1=T2...
    const label     = labels[dayOfWeek];
    const dateStr   = `${startDay.getDate()}/${startDay.getMonth() + 1}`;

    const songsCount = await Song.countDocuments({
      createdAt: { $gte: startDay, $lt: endDay },
    });

    const usersCount = await User.countDocuments({
      createdAt: { $gte: startDay, $lt: endDay },
    });

    const playsData = await Song.aggregate([
      { $match: { createdAt: { $gte: startDay, $lt: endDay } } },
      { $group: { _id: null, total: { $sum: "$playCount" } } },
    ]);

    // ✅ Đánh dấu ngày hôm nay
    const isToday = startDay.toDateString() === now.toDateString();

    days.push({
      day:     `${label}\n${dateStr}`,
      label:   label,
      date:    dateStr,
      songs:   songsCount,
      users:   usersCount,
      plays:   playsData[0]?.total || 0,
      isToday,
    });
  }

  return days;
};
// ✅ Định nghĩa getMonthlyStats TRƯỚC getStats
const getMonthlyStats = async () => {
  const months = [];
  const now    = new Date();

  for (let i = 11; i >= 0; i--) {
    const date       = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endMonth   = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const label = `T${date.getMonth() + 1}`;

    const songsCount = await Song.countDocuments({
      createdAt: { $gte: startMonth, $lt: endMonth },
    });

    const usersCount = await User.countDocuments({
      createdAt: { $gte: startMonth, $lt: endMonth },
    });

    const playsData = await Song.aggregate([
      { $match: { createdAt: { $gte: startMonth, $lt: endMonth } } },
      { $group: { _id: null, total: { $sum: "$playCount" } } },
    ]);

    months.push({
      month: label,
      songs: songsCount,
      users: usersCount,
      plays: playsData[0]?.total || 0,
    });
  }

  return months;
};



// ✅ getStats sau getMonthlyStats
const getStats = async (req, res, next) => {
  try {
    const totalUsers  = await User.countDocuments();
    const totalSongs  = await Song.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalPlays  = await Song.aggregate([
      { $group: { _id: null, total: { $sum: "$playCount" } } }
    ]);
    const recentSongs = await Song.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("uploadedBy", "username");
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    const monthlyStats = await getMonthlyStats();
    const dailyStats   = await getDailyStats(); // ✅ Thêm

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSongs,
        totalAdmins,
        totalPlays: totalPlays[0]?.total || 0,
        recentSongs,
        recentUsers,
        monthlyStats,
        dailyStats, // ✅ Thêm
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