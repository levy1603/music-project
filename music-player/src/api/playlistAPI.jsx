// src/api/playlistAPI.js
import axiosClient from "./axiosClient";

const playlistAPI = {
  // Lấy playlist của tôi
  getMine: () => {
    return axiosClient.get("/playlists");
  },

  // Lấy playlist công khai
  getPublic: () => {
    return axiosClient.get("/playlists/public");
  },

  // Lấy chi tiết playlist
  getById: (id) => {
    return axiosClient.get(`/playlists/${id}`);
  },

  // Tạo playlist mới
  create: (data) => {
    return axiosClient.post("/playlists", data);
  },

  // Cập nhật playlist
  update: (id, data) => {
    return axiosClient.put(`/playlists/${id}`, data);
  },

  // Xóa playlist
  delete: (id) => {
    return axiosClient.delete(`/playlists/${id}`);
  },

  // Thêm bài hát vào playlist
  addSong: (playlistId, songId) => {
    return axiosClient.put(`/playlists/${playlistId}/add-song`, { songId });
  },

  // Xóa bài hát khỏi playlist
  removeSong: (playlistId, songId) => {
    return axiosClient.put(`/playlists/${playlistId}/remove-song`, { songId });
  },
};

export default playlistAPI;