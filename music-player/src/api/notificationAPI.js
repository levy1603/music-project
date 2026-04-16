// src/api/notificationAPI.js
import axiosClient from "./axiosClient";

const notificationAPI = {
  // Lấy danh sách thông báo
  // Response trả về: { success, notifications, unreadCount, total, ... }
  getAll: (params = {}) =>
    axiosClient.get("/notifications", { params }),

  // Đánh dấu 1 thông báo đã đọc
  markRead: (id) =>
    axiosClient.patch(`/notifications/${id}/read`),

  // Đánh dấu tất cả đã đọc
  markAllRead: () =>
    axiosClient.patch("/notifications/read-all"),

  // Xóa thông báo
  delete: (id) =>
    axiosClient.delete(`/notifications/${id}`),
};

export default notificationAPI;