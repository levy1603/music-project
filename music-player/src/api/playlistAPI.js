// src/api/playlistAPI.js

// URL gốc của backend, ưu tiên lấy từ biến môi trường.
const API_BASE = process.env.REACT_APP_API_URL || "";

// Lấy access token đã lưu sau khi người dùng đăng nhập.
const getToken = () => localStorage.getItem("token");

// Tạo header chung cho mọi request, có thể bật/tắt Content-Type JSON.
const buildHeaders = (isJson = true) => {
  const headers = {};

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Chuẩn hóa dữ liệu trả về và ném lỗi nếu API báo thất bại.
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra khi gọi API playlist");
  }

  return data;
};

const playlistAPI = {
  // Lấy toàn bộ playlist của người dùng.
  getAll: async () => {
    const response = await fetch(`${API_BASE}/api/playlists`, {
      method: "GET",
      headers: buildHeaders(false),
    });

    return handleResponse(response);
  },

  // Lấy chi tiết một playlist theo id.
  getById: async (playlistId) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: "GET",
      headers: buildHeaders(false),
    });

    return handleResponse(response);
  },

  // Tạo playlist mới từ dữ liệu gửi lên.
  create: async (payload) => {
    const response = await fetch(`${API_BASE}/api/playlists`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },

  // Cập nhật thông tin playlist hiện có.
  update: async (playlistId, payload) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },

  // Xóa playlist theo id.
  remove: async (playlistId) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: "DELETE",
      headers: buildHeaders(false),
    });

    return handleResponse(response);
  },

  // Thêm một bài hát vào playlist.
  addSong: async (playlistId, songId) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}/add-song`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify({ songId }),
    });

    return handleResponse(response);
  },

  // Gỡ một bài hát ra khỏi playlist.
  removeSong: async (playlistId, songId) => {
    const response = await fetch(
      `${API_BASE}/api/playlists/${playlistId}/remove-song`,
      {
        method: "PUT",
        headers: buildHeaders(true),
        body: JSON.stringify({ songId }),
      }
    );

    return handleResponse(response);
  },
};

export default playlistAPI;
