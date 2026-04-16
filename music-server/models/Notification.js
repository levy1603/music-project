//models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "new_upload",      // User upload bài mới
        "song_approved",   // Admin duyệt bài
        "song_rejected",   // Admin từ chối bài
        "system",          // Thông báo hệ thống
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    data: {
      songId:    { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
      songTitle: String,
      artist:    String,
      coverImage: String,
      rejectReason: String,
    },
    isRead:   { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }, // Xóa mềm
  },
  { timestamps: true }
);

// Index để query nhanh
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);