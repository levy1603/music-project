// src/api/userAPI.jsx
import axiosClient from "./axiosClient";

const userAPI = {
  getFavorites: () => {
    return axiosClient.get("/users/favorites");
  },

  updateProfile: (data) => {
    return axiosClient.put("/users/profile", data);
  },

  // Upload avatar
  updateAvatar: (formData) => {
    return axiosClient.put("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getProfile: (userId) => {
    return axiosClient.get(`/users/${userId}`);
  },
};

export default userAPI;