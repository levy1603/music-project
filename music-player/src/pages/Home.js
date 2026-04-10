// src/pages/Home.js
import React from "react";
import SongList from "../components/SongList";
import { useMusicContext } from "../context/MusicContext";

const Home = () => {
  const { filteredSongs, searchTerm, loading, songs } = useMusicContext();

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
          <p>🔄 Đang tải bài hát...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <SongList
        songs={filteredSongs}
        title={searchTerm ? `Kết quả: "${searchTerm}"` : "🎧 Tất Cả Bài Hát"}
        source="home"      // ✅ Thêm
        queue={songs}      // ✅ Thêm - dùng songs gốc (không filter)
      />
    </div>
  );
};

export default Home;