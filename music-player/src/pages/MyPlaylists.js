// src/pages/MyPlaylists.js
import React, { useState, useEffect } from "react";
import { FaThLarge, FaList, FaPlus } from "react-icons/fa";
import PlaylistCard from "../components/playlist/PlaylistCard";
import PlaylistItem from "../components/playlist/PlaylistItem";
import PlaylistModal from "../components/playlist/PlaylistModal";
import PlaylistDetail from "../components/playlist/PlaylistDetail";
import "./MyPlaylists.css";

const MyPlaylists = () => {
  const [playlists, setPlaylists]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [viewMode, setViewMode]               = useState("grid");
  const [showModal, setShowModal]             = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // ===== FETCH PLAYLISTS =====
  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPlaylists(data.data);
    } catch (err) {
      console.error("Lỗi tải playlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // ===== XỬ LÝ TẠO / SỬA =====
  const handleOpenCreate = () => {
    setEditingPlaylist(null);
    setShowModal(true);
  };

  const handleOpenEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setShowModal(true);
  };

  const handleSavePlaylist = async (formData) => {
    const token = localStorage.getItem("token");

    try {
      if (editingPlaylist) {
        // ===== SỬA =====
        const res = await fetch(`/api/playlists/${editingPlaylist._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setPlaylists((prev) =>
            prev.map((pl) => (pl._id === editingPlaylist._id ? data.data : pl))
          );
          // ✅ Cập nhật selectedPlaylist giữ lại songs
          if (selectedPlaylist?._id === editingPlaylist._id) {
            setSelectedPlaylist((prev) => ({
              ...prev,
              ...data.data,
              songs: prev.songs,
            }));
          }
        }
      } else {
        // ===== TẠO MỚI =====
        const res = await fetch("/api/playlists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setPlaylists((prev) => [data.data, ...prev]);
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error("Lỗi lưu playlist:", err);
    }
  };

  // ===== XỬ LÝ XÓA =====
  const handleDelete = async (playlistId) => {
    if (!window.confirm("Bạn có chắc muốn xóa playlist này không?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPlaylists((prev) => prev.filter((pl) => pl._id !== playlistId));
        if (selectedPlaylist?._id === playlistId) setSelectedPlaylist(null);
      }
    } catch (err) {
      console.error("Lỗi xóa playlist:", err);
    }
  };

  // ===== XỬ LÝ XÓA BÀI HÁT =====
  const handleRemoveSong = async (playlistId, songId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/playlists/${playlistId}/remove-song`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPlaylist((prev) => ({
          ...prev,
          songs: prev.songs.filter((s) => s._id !== songId),
        }));
        fetchPlaylists();
      }
    } catch (err) {
      console.error("Lỗi xóa bài hát:", err);
    }
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="myplaylists-loading">
        <div className="spinner" />
        <p>Đang tải playlist...</p>
      </div>
    );
  }

  return (
    // ✅ Bọc tất cả trong 1 div duy nhất
    // → Modal luôn render dù đang xem detail hay danh sách
    <div className="myplaylists-wrapper">

      {/* ===== DETAIL VIEW ===== */}
      {selectedPlaylist ? (
        <PlaylistDetail
          playlist={selectedPlaylist}
          onBack={() => setSelectedPlaylist(null)}
          onEdit={() => handleOpenEdit(selectedPlaylist)}
          onDelete={() => handleDelete(selectedPlaylist._id)}
          onRemoveSong={(songId) => handleRemoveSong(selectedPlaylist._id, songId)}
        />
      ) : (
        // ===== LIST VIEW =====
        <div className="myplaylists-page">

          {/* Header */}
          <div className="myplaylists-header">
            <div className="myplaylists-title">
              <h2>Các Playlist</h2>
              <span className="playlist-count">{playlists.length} playlist</span>
            </div>

            <div className="myplaylists-actions">
              {/* Toggle Grid / List */}
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Dạng lưới"
                >
                  <FaThLarge />
                </button>
                <button
                  className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="Dạng danh sách"
                >
                  <FaList />
                </button>
              </div>

              {/* Nút tạo mới */}
              <button className="btn-create" onClick={handleOpenCreate}>
                <FaPlus />
                <span>Tạo Playlist</span>
              </button>
            </div>
          </div>

          {/* Danh sách */}
          {playlists.length === 0 ? (
            <div className="myplaylists-empty">
              <img src="/images/empty-playlist.png" alt="empty" />
              <p>Bạn chưa có playlist nào</p>
              <button className="btn-create" onClick={handleOpenCreate}>
                <FaPlus /> Tạo playlist đầu tiên
              </button>
            </div>
          ) : viewMode === "grid" ? (
            // Grid View
            <div className="playlists-grid">
              {playlists.map((pl) => (
                <PlaylistCard
                  key={pl._id}
                  playlist={pl}
                  onClick={() => setSelectedPlaylist(pl)}
                  onEdit={() => handleOpenEdit(pl)}
                  onDelete={() => handleDelete(pl._id)}
                />
              ))}
            </div>
          ) : (
            // List View
            <div className="playlists-list">
              {playlists.map((pl, index) => (
                <PlaylistItem
                  key={pl._id}
                  playlist={pl}
                  index={index + 1}
                  onClick={() => setSelectedPlaylist(pl)}
                  onEdit={() => handleOpenEdit(pl)}
                  onDelete={() => handleDelete(pl._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ Modal luôn nằm ngoài cùng → không bị che bởi PlaylistDetail */}
      {showModal && (
        <PlaylistModal
          playlist={editingPlaylist}
          onSave={handleSavePlaylist}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  );
};

export default MyPlaylists;