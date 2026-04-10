// src/pages/Playlist.js
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SongList from "../components/SongList";
import { useMusicContext } from "../context/MusicContext";
import { useAuth } from "../context/AuthContext";
import { FaHistory, FaTrash, FaMusic } from "react-icons/fa";
import "./Playlist.css";

const Playlist = () => {
  const { songs, listenedSongIds, playSong } = useMusicContext();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ Lọc các bài đã nghe, giữ thứ tự mới nhất lên đầu
  const listenedSongs = useMemo(() => {
    return listenedSongIds
      .map((id) => songs.find((s) => s._id === id))
      .filter(Boolean); // lọc bỏ undefined
  }, [listenedSongIds, songs]);

  // ✅ Xóa lịch sử
  const handleClearHistory = () => {
    if (!window.confirm("Xóa toàn bộ lịch sử nghe?")) return;
    localStorage.removeItem(`listened_${user?._id}`);
    window.location.reload(); // reload để reset state
  };

  if (!isAuthenticated) {
    return (
      <div className="page-content">
        <div className="playlist-empty">
          <FaMusic className="playlist-empty-icon" />
          <p>Vui lòng đăng nhập để xem lịch sử nghe</p>
          <button
            className="playlist-login-btn"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (listenedSongs.length === 0) {
    return (
      <div className="page-content">
        <div className="playlist-empty">
          <FaHistory className="playlist-empty-icon" />
          <p>Bạn chưa nghe bài hát nào</p>
          <button
            className="playlist-login-btn"
            onClick={() => navigate("/")}
          >
            Khám phá nhạc
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* ===== HEADER ===== */}
      <div className="playlist-header">
        <div className="playlist-title">
          <FaHistory className="playlist-title-icon" />
          <div>
            <h2>Lịch sử nghe</h2>
            <span>{listenedSongs.length} bài hát</span>
          </div>
        </div>

        <button
          className="playlist-clear-btn"
          onClick={handleClearHistory}
          title="Xóa lịch sử"
        >
          <FaTrash /> Xóa lịch sử
        </button>
      </div>

      {/* ===== DANH SÁCH ===== */}
      <SongList
        songs={listenedSongs}
        title=""
      />
    </div>
  );
};

export default Playlist;