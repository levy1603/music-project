// src/components/playlist/AddToPlaylistModal.js
import React, { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaCheck, FaMusic, FaLock, FaGlobe } from "react-icons/fa";
import "./AddToPlaylistModal.css";

const AddToPlaylistModal = ({ song, onClose }) => {
  const [playlists, setPlaylists]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [adding, setAdding]         = useState(null);   // id playlist đang thêm
  const [added, setAdded]           = useState([]);     // id playlist đã thêm thành công
  const [error, setError]           = useState("");

  // ===== FETCH PLAYLISTS =====
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setPlaylists(data.data);
      } catch (err) {
        setError("Không thể tải danh sách playlist");
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  // ===== THÊM VÀO PLAYLIST =====
  const handleAdd = async (playlistId) => {
    if (added.includes(playlistId)) return; // Đã thêm rồi thì bỏ qua

    setAdding(playlistId);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/playlists/${playlistId}/add-song`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: song._id }),
      });
      const data = await res.json();

      if (data.success) {
        setAdded((prev) => [...prev, playlistId]); // Đánh dấu đã thêm
      } else {
        // Bài hát đã có trong playlist
        setError(data.message || "Không thể thêm bài hát");
        // Vẫn đánh dấu là đã có
        if (data.message?.includes("đã có")) {
          setAdded((prev) => [...prev, playlistId]);
        }
      }
    } catch (err) {
      setError("Lỗi kết nối, thử lại sau");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="atp-overlay" onClick={onClose}>
      <div className="atp-modal" onClick={(e) => e.stopPropagation()}>

        {/* ===== HEADER ===== */}
        <div className="atp-header">
          <div>
            <h3>Thêm vào Playlist</h3>
            <p className="atp-song-name">
              <FaMusic /> {song.title} - {song.artist}
            </p>
          </div>
          <button className="atp-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* ===== ERROR ===== */}
        {error && <p className="atp-error">{error}</p>}

        {/* ===== DANH SÁCH PLAYLIST ===== */}
        <div className="atp-body">
          {loading ? (
            <div className="atp-loading">
              <div className="atp-spinner" />
              <p>Đang tải...</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="atp-empty">
              <FaMusic />
              <p>Bạn chưa có playlist nào</p>
              <span>Hãy tạo playlist trong mục "Các Playlist"</span>
            </div>
          ) : (
            <ul className="atp-list">
              {playlists.map((pl) => {
                const isAdded   = added.includes(pl._id);
                const isAdding  = adding === pl._id;

                return (
                  <li
                    key={pl._id}
                    className={`atp-item ${isAdded ? "is-added" : ""}`}
                    onClick={() => handleAdd(pl._id)}
                  >
                    {/* Ảnh bìa */}
                    <img
                      src={
                        pl.coverImage && pl.coverImage !== "default-playlist.jpg"
                          ? pl.coverImage
                          : "/images/default-playlist.jpg"
                      }
                      alt={pl.name}
                      className="atp-cover"
                    />

                    {/* Thông tin */}
                    <div className="atp-info">
                      <span className="atp-name">{pl.name}</span>
                      <span className="atp-meta">
                        {pl.isPublic
                          ? <><FaGlobe /> Công khai</>
                          : <><FaLock /> Riêng tư</>
                        }
                        &nbsp;·&nbsp; {pl.songs?.length || 0} bài
                      </span>
                    </div>

                    {/* Nút thêm */}
                    <button
                      className={`atp-btn ${isAdded ? "added" : ""}`}
                      disabled={isAdding || isAdded}
                    >
                      {isAdding ? (
                        <div className="atp-spinner small" />
                      ) : isAdded ? (
                        <FaCheck />
                      ) : (
                        <FaPlus />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;