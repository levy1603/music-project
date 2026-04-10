// src/pages/Favorites.js
import React, { useEffect, useState } from "react";
import SongList from "../components/SongList";
import userAPI from "../api/userAPI";

const Favorites = () => {
  const [favSongs, setFavSongs] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await userAPI.getFavorites();
        setFavSongs(res.data);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
          <p>🔄 Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <SongList
        songs={favSongs}
        title="❤️ Bài Hát Yêu Thích"
        source="favorites" // ✅ Thêm
        queue={favSongs}   // ✅ Thêm
      />
    </div>
  );
};

export default Favorites;