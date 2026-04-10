// src/api/songAPI.js
import axiosClient from "./axiosClient";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

/* ── Helper: lấy token ── */
const getToken = () => localStorage.getItem("token");

/* ── Helper: tạo config upload có progress ── */
const createUploadConfig = (onProgress) => ({
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${getToken()}`,
  },
  onUploadProgress: (progressEvent) => {
    if (onProgress && progressEvent.total) {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percent);
    }
  },
});

const songAPI = {
  /* ═══════════════════════════════════════
     PUBLIC - Bài đã được duyệt
  ═══════════════════════════════════════ */

  // Lấy danh sách bài hát (chỉ approved)
  getAll: (params) => {
    return axiosClient.get("/songs", { params });
  },

  // Top bài hát (chỉ approved)
  getTop: (limit = 10) => {
    return axiosClient.get("/songs/top", { params: { limit } });
  },

  // Chi tiết 1 bài (chỉ approved)
  getById: (id) => {
    return axiosClient.get(`/songs/${id}`);
  },

  /* ═══════════════════════════════════════
     USER - Quản lý bài của mình
  ═══════════════════════════════════════ */

  // Lịch sử upload (cả pending / rejected / approved)
  getMySongs: () => {
    return axiosClient.get("/songs/my-songs");
  },

    getMyUploads: () => {
    return axiosClient.get("/songs/my-songs");
  },


  // Upload bài mới → backend sẽ set status: "pending"
  create: (formData, onProgress) => {
    return axios
      .post(`${BASE_URL}/songs`, formData, createUploadConfig(onProgress))
      .then((res) => res.data);
  },

  // Cập nhật bài hát
  update: (id, formData, onProgress) => {
    return axios
      .put(`${BASE_URL}/songs/${id}`, formData, createUploadConfig(onProgress))
      .then((res) => res.data);
  },

  // Xoá bài hát
  delete: (id) => {
    return axiosClient.delete(`/songs/${id}`);
  },

  // Tăng lượt play
  play: (id) => {
    return axiosClient.put(`/songs/${id}/play`);
  },

  // Like / Unlike
  like: (id) => {
    return axiosClient.put(`/songs/${id}/like`);
  },

  /* ═══════════════════════════════════════
     ADMIN - Quản lý upload
  ═══════════════════════════════════════ */

  /**
   * Lấy tất cả uploads (mọi status)
   * @param {Object} params - { status: "all"|"pending"|"approved"|"rejected", page, limit }
   */
adminGetAllUploads: (params = {}) => {
  return axiosClient.get("/songs/admin/uploads", { params });
},

adminApproveSong: (id) => {
  return axiosClient.patch(`/songs/admin/uploads/${id}/approve`);
},

adminRejectSong: (id, reason = "") => {
  return axiosClient.patch(`/songs/admin/uploads/${id}/reject`, { reason });
},

adminDeleteSong: (id) => {
  return axiosClient.delete(`/songs/${id}`); // dùng delete thường
},
  /* ═══════════════════════════════════════
     HELPER
  ═══════════════════════════════════════ */

  // Lấy URL audio
  getAudioURL: (song) => {
    if (!song?.audioFile) return null;
    if (song.audioFile.startsWith("http")) return song.audioFile;
    return `${BASE_URL.replace("/api", "")}/uploads/songs/${song.audioFile}`;
  },

  // Lấy URL video
  getVideoURL: (song) => {
    if (!song?.videoFile) return null;
    if (song.videoFile.startsWith("http")) return song.videoFile;
    return `${BASE_URL.replace("/api", "")}/uploads/videos/${song.videoFile}`;
  },

  // Lấy URL cover
  getCoverURL: (song) => {
    if (!song?.coverImage) return null;
    if (song.coverImage === "default-cover.jpg") {
      return `${BASE_URL.replace("/api", "")}/uploads/covers/default-cover.jpg`;
    }
    if (song.coverImage.startsWith("http")) return song.coverImage;
    return `${BASE_URL.replace("/api", "")}/uploads/covers/${song.coverImage}`;
  },
};

export default songAPI;