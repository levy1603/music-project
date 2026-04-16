//services/notificationService.js
const Notification = require("../models/Notification");
const User         = require("../models/User");

const notificationService = {
  /**
   * Tạo thông báo cho 1 user cụ thể
   */
  async create({ recipient, sender, type, title, message, data = {} }) {
    const notification = await Notification.create({
      recipient, sender, type, title, message, data,
    });
    return notification;
  },

  /**
   * Gửi thông báo tới TẤT CẢ admin
   */
  async notifyAllAdmins({ sender, type, title, message, data = {} }) {
    const admins = await User.find({ role: "admin" }).select("_id");
    if (!admins.length) return [];

    const notifications = await Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        sender,
        type,
        title,
        message,
        data,
      }))
    );
    return notifications;
  },

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  },

  /**
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  },

  /**
   * Lấy danh sách thông báo
   */
  async getByUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId, isHidden: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "username avatar")
        .populate("data.songId", "title artist coverImage"),
      Notification.countDocuments({ recipient: userId, isHidden: false }),
      Notification.countDocuments({ recipient: userId, isRead: false, isHidden: false }),
    ]);

    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Xóa mềm thông báo
   */
  async hide(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isHidden: true }
    );
  },
  async getByUser(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  console.log("🔍 getByUser - userId:", userId);
  console.log("🔍 userId type:", typeof userId);

  // Đếm TỔNG notification trong DB (không filter)
  const totalInDB = await Notification.countDocuments({});
  console.log("🔍 Tổng notification trong DB:", totalInDB);

  // Đếm theo recipient
  const forThisUser = await Notification.countDocuments({ recipient: userId });
  console.log("🔍 Notification cho userId này:", forThisUser);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId, isHidden: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username avatar"),
    Notification.countDocuments({ recipient: userId, isHidden: false }),
    Notification.countDocuments({ recipient: userId, isRead: false, isHidden: false }),
  ]);

  console.log("🔍 Kết quả:", notifications.length, "docs");
  // Log recipient của từng doc
  notifications.forEach((n, i) => {
    console.log(`   [${i}] recipient: ${n.recipient} | type: ${n.type}`);
  });

  return {
    notifications, total, unreadCount,
    page, totalPages: Math.ceil(total / limit),
  };
},
};


module.exports = notificationService;