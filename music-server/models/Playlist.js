// models/Playlist.js
const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên playlist"],
      trim: true,
      maxlength: [50, "Tên tối đa 50 ký tự"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [200, "Mô tả tối đa 200 ký tự"],
    },
    coverImage: {
      type: String,
      default: "default-playlist.jpg",
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Playlist", playlistSchema);