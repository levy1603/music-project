// src/components/MySongsList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMusic, FaPlay, FaPause, FaEdit,
  FaTrash, FaSpinner, FaCompactDisc,
  FaTimes, FaCheck, FaSave,
} from "react-icons/fa";
import songAPI from "../api/songAPI";
import { useMusicContext } from "../context/MusicContext";
import "./MySongsList.css";

const BASE_URL = "http://localhost:5000";

const getCoverURL = (song) => {
  if (!song?.coverImage) return "/default-cover.jpg";
  if (song.coverImage.startsWith("http")) return song.coverImage;
  return `${BASE_URL}/uploads/covers/${song.coverImage}`;
};

const MySongsList = ({ onClose }) => {
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay, fetchSongs } =
    useMusicContext();

  const [songs, setSongs]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId]   = useState(null);

  // ===== STATE CHỈNH SỬA =====
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({
    title  : "",
    artist : "",
    album  : "",
    genre  : "",
  });
  const [savingId, setSavingId]     = useState(null);
  const [editError, setEditError]   = useState("");

  // ===== FETCH =====
  useEffect(() => {
    fetchMySongs();
  }, []);

  const fetchMySongs = async () => {
    try {
      setLoading(true);
      const res  = await songAPI.getMySongs();
      const data = res.data?.data || res.data;
      setSongs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Không thể tải danh sách bài hát!");
    } finally {
      setLoading(false);
    }
  };

  // ===== PLAY =====
  const handlePlay = (song) => {
    if (currentSong?._id === song._id) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  // ===== MỞ FORM CHỈNH SỬA =====
  const handleOpenEdit = (song) => {
    setEditingId(song._id);
    setEditForm({
      title  : song.title  || "",
      artist : song.artist || "",
      album  : song.album  || "",
      genre  : song.genre  || "",
    });
    setEditError("");
    // Đóng confirm delete nếu đang mở
    setConfirmId(null);
  };

  // ===== HỦY CHỈNH SỬA =====
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", artist: "", album: "", genre: "" });
    setEditError("");
  };

  // ===== LƯU CHỈNH SỬA =====
  const handleSaveEdit = async (songId) => {
    if (!editForm.title.trim()) {
      setEditError("Tên bài hát không được để trống!");
      return;
    }
    if (!editForm.artist.trim()) {
      setEditError("Tên nghệ sĩ không được để trống!");
      return;
    }

    setSavingId(songId);
    setEditError("");

    try {
      const formData = new FormData();
      formData.append("title",  editForm.title.trim());
      formData.append("artist", editForm.artist.trim());
      formData.append("album",  editForm.album.trim());
      formData.append("genre",  editForm.genre.trim());

      await songAPI.update(songId, formData);

      // Cập nhật local state
      setSongs((prev) =>
        prev.map((s) =>
          s._id === songId
            ? { ...s, ...editForm }
            : s
        )
      );

      // Refresh danh sách chung
      fetchSongs();
      handleCancelEdit();

    } catch (err) {
      setEditError(
        err.response?.data?.message || "Lỗi khi cập nhật bài hát!"
      );
    } finally {
      setSavingId(null);
    }
  };

  // ===== DELETE =====
  const handleDelete = async (songId) => {
    setDeletingId(songId);
    try {
      await songAPI.delete(songId);
      setSongs((prev) => prev.filter((s) => s._id !== songId));
      setConfirmId(null);
      fetchSongs();
    } catch (err) {
      setError("Không thể xóa bài hát!");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  // Danh sách thể loại
  const genres = [
    "Pop", "Rock", "R&B", "Hip-Hop", "Jazz",
    "Classical", "Electronic", "Indie", "Ballad", "Khác",
  ];

  return (
    <div className="my-songs-overlay" onClick={onClose}>
      <div
        className="my-songs-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="my-songs-header">
          <div className="my-songs-title">
            <FaCompactDisc className="my-songs-icon" />
            <h3>Bài hát đã upload</h3>
            <span className="my-songs-count">{songs.length}</span>
          </div>
          <button className="my-songs-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="my-songs-content">
          {loading ? (
            <div className="my-songs-loading">
              <FaSpinner className="spinning" />
              <p>Đang tải...</p>
            </div>
          ) : error ? (
            <div className="my-songs-error">
              <p>{error}</p>
              <button onClick={fetchMySongs}>Thử lại</button>
            </div>
          ) : songs.length === 0 ? (
            <div className="my-songs-empty">
              <FaMusic className="empty-icon" />
              <p>Bạn chưa upload bài hát nào</p>
              <button
                className="upload-now-btn"
                onClick={() => { onClose(); navigate("/upload"); }}
              >
                Upload ngay
              </button>
            </div>
          ) : (
            <div className="my-songs-list">
              {songs.map((song, index) => {
                const isCurrentSong = currentSong?._id === song._id;
                const isThisPlaying = isCurrentSong && isPlaying;
                const isEditing     = editingId === song._id;

                return (
                  <div
                    key={song._id}
                    className={`my-song-item ${isCurrentSong ? "active" : ""} ${isEditing ? "editing" : ""}`}
                  >
                    {/* ===== NORMAL VIEW ===== */}
                    {!isEditing ? (
                      <>
                        {/* Index */}
                        <span className="song-index">
                          {isThisPlaying ? (
                            <span className="playing-bars">
                              <span /><span /><span />
                            </span>
                          ) : (
                            index + 1
                          )}
                        </span>

                        {/* Cover */}
                        <div
                          className="song-cover-wrap"
                          onClick={() => handlePlay(song)}
                        >
                          <img
                            src={getCoverURL(song)}
                            alt={song.title}
                            className="song-cover"
                            onError={(e) => {
                              e.target.src = "/default-cover.jpg";
                            }}
                          />
                          <div className="song-cover-overlay">
                            {isThisPlaying ? <FaPause /> : <FaPlay />}
                          </div>
                        </div>

                        {/* Info */}
                        <div
                          className="song-info"
                          onClick={() => {
                            onClose();
                            navigate(`/song/${song._id}`);
                          }}
                        >
                          <span className="song-title">{song.title}</span>
                          <span className="song-artist">{song.artist}</span>
                          <span className="song-date">
                            {formatDate(song.createdAt)}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="song-stats-mini">
                          <span>▶ {song.playCount || 0}</span>
                        </div>

                        {/* Actions */}
                        <div className="song-actions">
                          {confirmId === song._id ? (
                            <div className="confirm-delete">
                              <span>Xóa?</span>
                              <button
                                className="confirm-yes"
                                onClick={() => handleDelete(song._id)}
                                disabled={deletingId === song._id}
                              >
                                {deletingId === song._id
                                  ? <FaSpinner className="spinning" />
                                  : <FaCheck />
                                }
                              </button>
                              <button
                                className="confirm-no"
                                onClick={() => setConfirmId(null)}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* ✅ Nút chỉnh sửa */}
                              <button
                                className="action-edit"
                                onClick={() => handleOpenEdit(song)}
                                title="Chỉnh sửa bài hát"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="action-delete"
                                onClick={() => setConfirmId(song._id)}
                                title="Xóa bài hát"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      // ===== EDIT VIEW =====
                      <div className="edit-song-form">

                        {/* Cover nhỏ */}
                        <img
                          src={getCoverURL(song)}
                          alt={song.title}
                          className="edit-cover"
                          onError={(e) => {
                            e.target.src = "/default-cover.jpg";
                          }}
                        />

                        {/* Form fields */}
                        <div className="edit-fields">
                          {/* Error */}
                          {editError && (
                            <div className="edit-error">
                              <FaTimes /> {editError}
                            </div>
                          )}

                          {/* Row 1: Title + Artist */}
                          <div className="edit-row">
                            <div className="edit-group">
                              <label>Tên bài hát *</label>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({
                                  ...editForm, title: e.target.value
                                })}
                                className="edit-input"
                                placeholder="Tên bài hát..."
                                maxLength={100}
                              />
                            </div>
                            <div className="edit-group">
                              <label>Nghệ sĩ *</label>
                              <input
                                type="text"
                                value={editForm.artist}
                                onChange={(e) => setEditForm({
                                  ...editForm, artist: e.target.value
                                })}
                                className="edit-input"
                                placeholder="Tên nghệ sĩ..."
                                maxLength={100}
                              />
                            </div>
                          </div>

                          {/* Row 2: Album + Genre */}
                          <div className="edit-row">
                            <div className="edit-group">
                              <label>Album</label>
                              <input
                                type="text"
                                value={editForm.album}
                                onChange={(e) => setEditForm({
                                  ...editForm, album: e.target.value
                                })}
                                className="edit-input"
                                placeholder="Tên album..."
                                maxLength={100}
                              />
                            </div>
                            <div className="edit-group">
                              <label>Thể loại</label>
                              <select
                                value={editForm.genre}
                                onChange={(e) => setEditForm({
                                  ...editForm, genre: e.target.value
                                })}
                                className="edit-select"
                              >
                                <option value="">Chọn thể loại...</option>
                                {genres.map((g) => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="edit-actions">
                            <button
                              className="edit-cancel-btn"
                              onClick={handleCancelEdit}
                              disabled={savingId === song._id}
                            >
                              <FaTimes /> Hủy
                            </button>
                            <button
                              className="edit-save-btn"
                              onClick={() => handleSaveEdit(song._id)}
                              disabled={savingId === song._id}
                            >
                              {savingId === song._id ? (
                                <><FaSpinner className="spinning" /> Đang lưu...</>
                              ) : (
                                <><FaSave /> Lưu</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySongsList;