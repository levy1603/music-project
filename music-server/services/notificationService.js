const Notification = require("../models/Notification");
const User = require("../models/User");

const notificationService = {
  async create({ recipient, sender, type, title, message, data = {} }) {
    return Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      data,
    });
  },

  async notifyAllAdmins({ sender, type, title, message, data = {} }) {
    const admins = await User.find({ role: "admin" }).select("_id");
    if (!admins.length) return [];

    return Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        sender,
        type,
        title,
        message,
        data,
      }))
    );
  },

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  },

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false, isHidden: false },
      { isRead: true }
    );
  },

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
      Notification.countDocuments({
        recipient: userId,
        isRead: false,
        isHidden: false,
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async hide(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isHidden: true }
    );
  },
};

module.exports = notificationService;
