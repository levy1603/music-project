const API_BASE = process.env.REACT_APP_API_URL || "";

const getToken = () => localStorage.getItem("token");

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

const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra khi gọi API playlist");
  }

  return data;
};

const playlistAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/api/playlists`, {
      method: "GET",
      headers: buildHeaders(false),
    });

    return handleResponse(response);
  },

  getById: async (playlistId) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: "GET",
      headers: buildHeaders(false),
    });

    return handleResponse(response);
  },

  create: async (payload) => {
    const response = await fetch(`${API_BASE}/api/playlists`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },

  update: async (playlistId, payload) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },

  remove: async (playlistId) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: "DELETE",
      headers: buildHeaders(false),
    });

    return handleResponse(response);
  },

  addSong: async (playlistId, songId) => {
    const response = await fetch(`${API_BASE}/api/playlists/${playlistId}/add-song`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify({ songId }),
    });

    return handleResponse(response);
  },

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