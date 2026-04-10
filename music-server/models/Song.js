// models/Song.js
const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Vui lòng nhập tên bài hát"],
      trim: true,
      maxlength: [100, "Tên tối đa 100 ký tự"],
    },
    artist: {
      type: String,
      required: [true, "Vui lòng nhập tên nghệ sĩ"],
      trim: true,
    },
    album: {
      type: String,
      default: "Single",
      trim: true,
    },
    genre: {
      type: String,
      enum: [
        "Pop", "Rock", "Ballad", "R&B",
        "Hip-Hop", "EDM", "Jazz", "Classical",
        "Indie", "Khác",
      ],
      default: "Pop",
    },
    duration:   { type: Number,  default: 0 },
    coverImage: { type: String,  default: "default-cover.jpg" },
    audioFile:  { type: String,  required: [true, "Vui lòng upload file nhạc"] },
    videoFile:  { type: String,  default: "" },
    lyrics:     { type: String,  default: "" },
    playCount:  { type: Number,  default: 0 },
    likeCount:  { type: Number,  default: 0 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ THÊM MỚI: Hệ thống duyệt bài
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectReason: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

songSchema.index({ title: "text", artist: "text", album: "text" });

// ✅ Index cho filter theo status (query nhanh hơn)
songSchema.index({ status: 1, createdAt: -1 });
songSchema.index({ uploadedBy: 1, status: 1 });

module.exports = mongoose.model("Song", songSchema);