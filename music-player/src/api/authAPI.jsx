// src/api/authAPI.js
import axiosClient from "./axiosClient";

const authAPI = {
  // Đăng ký
  register: (data) => {
    return axiosClient.post("/auth/register", data);
  },

  // Đăng nhập
  login: (data) => {
    return axiosClient.post("/auth/login", data);
  },

  // Lấy thông tin user hiện tại
  getMe: () => {
    return axiosClient.get("/auth/me");
  },

  // Đổi mật khẩu
  changePassword: (data) => {
    return axiosClient.put("/auth/change-password", data);
  },
};

export default authAPI;