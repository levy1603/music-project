// src/api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn token vào mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý response
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Token hết hạn → đăng xuất
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Chỉ redirect nếu không phải trang login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;