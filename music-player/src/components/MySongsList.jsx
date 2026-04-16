import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMusic, FaPlay, FaPause, FaEdit, FaTrash,
  FaSpinner, FaCompactDisc, FaTimes, FaCheck,
  FaSave, FaUndo, FaClock, FaExclamationTriangle,
} from "react-icons/fa";
import songAPI  from "../api/songAPI";
import trashAPI from "../api/trashAPI";
import { useMusicContext } from "../context/MusicContext";
import "./MySongsList.css";

const BASE_URL = "http://localhost:5000";

const getCoverURL = (song) => {
  if (!song?.coverImage) return "/default-cover.jpg";
  if (song.coverImage.startsWith("http")) return song.coverImage;
  return `${BASE_URL}/uploads/covers/${song.coverImage}`;
};

const getTrashCoverURL = (songData) => {
  if (!songData?.coverImage) return "/default-cover.jpg";
  if (songData.coverImage.startsWith("http")) return songData.coverImage;
  return `${BASE_URL}/uploads/covers/${songData.coverImage}`;
};

const formatTimeLeft = (seconds) => {
  if (seconds <= 0) return "Hết hạn";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} ngày ${h} giờ`;
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
};

const getBarColor = (seconds) => {
  const pct = (seconds / (7 * 86400)) * 100;
  if (pct > 50) return "#1db954";
  if (pct > 25) return "#facc15";
  return "#f87171";
};

const genres = [
  "Pop","Rock","R&B","Hip-Hop","Jazz",
  "Classical","Electronic","Indie","Ballad","Khác",
];

// ════════════════════════════════════════════════════════
// MODAL XÁC NHẬN - dùng chung cho cả soft & permanent
// ════════════════════════════════════════════════════════
const ConfirmModal = ({ isOpen, onClose, onConfirm, loading, type, songName }) => {
  if (!isOpen) return null;

  const isSoft = type === "soft";

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div
        className="confirm-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-modal-icon-wrap ${isSoft ? "warn" : "danger"}`}>
          {isSoft ? (
            <FaTrash />
          ) : (
            <FaExclamationTriangle />
          )}
        </div>

        <h4>{isSoft ? "Xóa bài hát?" : "Xóa vĩnh viễn?"}</h4>

        <p>
          {isSoft ? (
            <>
              Bài <strong>"{songName}"</strong> sẽ được chuyển vào{" "}
              <span className="highlight-trash">Thùng rác</span>.
              Bạn có thể khôi phục trong vòng <strong>7 ngày</strong>.
            </>
          ) : (
            <>
              Bài <strong>"{songName}"</strong> sẽ bị xóa hoàn toàn
              và <strong>không thể khôi phục</strong>.
            </>
          )}
        </p>

        <div className="confirm-modal-actions">
          <button
            className="confirm-modal-cancel"
            onClick={onClose}
            disabled={loading}
          >
            <FaTimes /> Hủy
          </button>
          <button
            className={`confirm-modal-confirm ${isSoft ? "soft" : "hard"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <><FaSpinner className="spinning" /> Đang xử lý...</>
            ) : isSoft ? (
              <><FaTrash /> Chuyển vào thùng rác</>
            ) : (
              <><FaExclamationTriangle /> Xóa vĩnh viễn</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
const MySongsList = ({ onClose }) => {
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay, fetchSongs } =
    useMusicContext();

  const [activeTab, setActiveTab] = useState("songs");

  // Songs state
  const [songs, setSongs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ title:"", artist:"", album:"", genre:"" });
  const [savingId, setSavingId]   = useState(null);
  const [editError, setEditError] = useState("");

  // Trash state
  const [trashItems, setTrashItems]         = useState([]);
  const [trashLoading, setTrashLoading]     = useState(false);
  const [trashError, setTrashError]         = useState("");
  const [restoringId, setRestoringId]       = useState(null);
  const [permDeletingId, setPermDeletingId] = useState(null);

  // ✅ Modal state - dùng chung
  const [modal, setModal] = useState({
    isOpen   : false,
    type     : "soft",      // "soft" | "permanent"
    songId   : null,
    songName : "",
    loading  : false,
  });

  // ════ FETCH ════
  const fetchMySongs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res  = await songAPI.getMySongs();
      const data = res.data?.data || res.data;
      setSongs(Array.isArray(data) ? data : []);
    } catch {
      setError("Không thể tải danh sách bài hát!");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrash = useCallback(async () => {
    try {
      setTrashLoading(true);
      setTrashError("");
      const res = await trashAPI.getTrash();
      setTrashItems(res.data?.data || []);
    } catch {
      setTrashError("Không thể tải thùng rác!");
    } finally {
      setTrashLoading(false);
    }
  }, []);

  useEffect(() => { fetchMySongs(); }, [fetchMySongs]);
  useEffect(() => {
    if (activeTab === "trash") fetchTrash();
  }, [activeTab, fetchTrash]);

  // ════ PLAY ════
  const handlePlay = (song) => {
    if (currentSong?._id === song._id) togglePlay();
    else playSong(song);
  };

  // ════ EDIT ════
  const handleOpenEdit = (song) => {
    setEditingId(song._id);
    setEditForm({
      title  : song.title  || "",
      artist : song.artist || "",
      album  : song.album  || "",
      genre  : song.genre  || "",
    });
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title:"", artist:"", album:"", genre:"" });
    setEditError("");
  };

  const handleSaveEdit = async (songId) => {
    if (!editForm.title.trim())  return setEditError("Tên bài hát không được để trống!");
    if (!editForm.artist.trim()) return setEditError("Tên nghệ sĩ không được để trống!");
    setSavingId(songId);
    setEditError("");
    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([k, v]) => formData.append(k, v.trim()));
      await songAPI.update(songId, formData);
      setSongs((prev) =>
        prev.map((s) => s._id === songId ? { ...s, ...editForm } : s)
      );
      fetchSongs();
      handleCancelEdit();
    } catch (err) {
      setEditError(err.response?.data?.message || "Lỗi khi cập nhật!");
    } finally {
      setSavingId(null);
    }
  };

  // ════ MỞ MODAL XÓA MỀM ════
  const openSoftDeleteModal = (song) => {
    setModal({
      isOpen   : true,
      type     : "soft",
      songId   : song._id,
      songName : song.title,
      loading  : false,
    });
  };

  // ════ XÓA MỀM (thực hiện) ════
  const handleSoftDelete = async () => {
    setModal((prev) => ({ ...prev, loading: true }));
    try {
      await trashAPI.softDelete(modal.songId);
      setSongs((prev) => prev.filter((s) => s._id !== modal.songId));
      fetchSongs();
      setModal({ isOpen: false, type: "soft", songId: null, songName: "", loading: false });
      // Chuyển sang tab trash
      setActiveTab("trash");
    } catch {
      setError("Không thể xóa bài hát!");
      setModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // ════ MỞ MODAL XÓA VĨNH VIỄN ════
  const openPermanentDeleteModal = (item) => {
    setModal({
      isOpen   : true,
      type     : "permanent",
      songId   : item._id,
      songName : item.songData?.title || "",
      loading  : false,
    });
  };

  // ════ XÓA VĨNH VIỄN (thực hiện) ════
  const handlePermanentDelete = async () => {
    setModal((prev) => ({ ...prev, loading: true }));
    setPermDeletingId(modal.songId);
    try {
      await trashAPI.permanentDelete(modal.songId);
      setTrashItems((prev) => prev.filter((t) => t._id !== modal.songId));
      setModal({ isOpen: false, type: "soft", songId: null, songName: "", loading: false });
    } catch {
      setTrashError("Không thể xóa vĩnh viễn!");
      setModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setPermDeletingId(null);
    }
  };

  // ════ KHÔI PHỤC ════
  const handleRestore = async (trashId) => {
    setRestoringId(trashId);
    try {
      await trashAPI.restore(trashId);
      setTrashItems((prev) => prev.filter((t) => t._id !== trashId));
      fetchMySongs();
      fetchSongs();
    } catch {
      setTrashError("Không thể khôi phục!");
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("vi-VN", {
      day:"2-digit", month:"2-digit", year:"numeric"
    });

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <>
      <div className="my-songs-overlay" onClick={onClose}>
        <div className="my-songs-panel" onClick={(e) => e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div className="my-songs-header">
            <div className="my-songs-title">
              <FaCompactDisc className="my-songs-icon" />
              <h3>Nhạc của tôi</h3>
            </div>
            <button className="my-songs-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* ── TABS ── */}
          <div className="msl-tabs">
            <button
              className={`msl-tab ${activeTab === "songs" ? "active" : ""}`}
              onClick={() => setActiveTab("songs")}
            >
              <FaMusic />
              <span>Đã upload</span>
              <span className="msl-badge">{songs.length}</span>
            </button>
            <button
              className={`msl-tab trash-tab ${activeTab === "trash" ? "active" : ""}`}
              onClick={() => setActiveTab("trash")}
            >
              <FaTrash />
              <span>Thùng rác</span>
              {trashItems.length > 0 && (
                <span className="msl-badge danger">{trashItems.length}</span>
              )}
            </button>
          </div>

          {/* ══════════ TAB: SONGS ══════════ */}
          {activeTab === "songs" && (
            <div className="my-songs-content">
              {loading ? (
                <div className="my-songs-loading">
                  <FaSpinner className="spinning" size={24} />
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
                    const isCurrent  = currentSong?._id === song._id;
                    const isPlaying_ = isCurrent && isPlaying;
                    const isEditing  = editingId === song._id;

                    return (
                      <div
                        key={song._id}
                        className={`my-song-item
                          ${isCurrent ? "active" : ""}
                          ${isEditing ? "editing" : ""}`}
                      >
                        {!isEditing ? (
                          <>
                            {/* Index */}
                            <span className="song-index">
                              {isPlaying_
                                ? <span className="playing-bars"><span/><span/><span/></span>
                                : index + 1
                              }
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
                                onError={(e) => { e.target.src = "/default-cover.jpg"; }}
                              />
                              <div className="song-cover-overlay">
                                {isPlaying_ ? <FaPause /> : <FaPlay />}
                              </div>
                            </div>

                            {/* Info */}
                            <div
                              className="song-info"
                              onClick={() => { onClose(); navigate(`/song/${song._id}`); }}
                            >
                              <span className="song-title">{song.title}</span>
                              <span className="song-artist">{song.artist}</span>
                              <span className="song-date">{formatDate(song.createdAt)}</span>
                            </div>

                            {/* Stats */}
                            <div className="song-stats-mini">
                              <span>▶ {song.playCount || 0}</span>
                            </div>

                            {/* ✅ Actions - chỉ 2 icon, không có confirm inline */}
                            <div className="song-actions">
                              <button
                                className="action-edit"
                                onClick={() => handleOpenEdit(song)}
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="action-delete"
                                onClick={() => openSoftDeleteModal(song)}
                                title="Xóa vào thùng rác"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </>
                        ) : (
                          /* ── EDIT FORM ── */
                          <div className="edit-song-form">
                            <img
                              src={getCoverURL(song)}
                              alt={song.title}
                              className="edit-cover"
                              onError={(e) => { e.target.src = "/default-cover.jpg"; }}
                            />
                            <div className="edit-fields">
                              {editError && (
                                <div className="edit-error">
                                  <FaTimes /> {editError}
                                </div>
                              )}
                              <div className="edit-row">
                                <div className="edit-group">
                                  <label>Tên bài hát *</label>
                                  <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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
                                    onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                                    className="edit-input"
                                    placeholder="Tên nghệ sĩ..."
                                    maxLength={100}
                                  />
                                </div>
                              </div>
                              <div className="edit-row">
                                <div className="edit-group">
                                  <label>Album</label>
                                  <input
                                    type="text"
                                    value={editForm.album}
                                    onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                                    className="edit-input"
                                    placeholder="Tên album..."
                                    maxLength={100}
                                  />
                                </div>
                                <div className="edit-group">
                                  <label>Thể loại</label>
                                  <select
                                    value={editForm.genre}
                                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                                    className="edit-select"
                                  >
                                    <option value="">Chọn thể loại...</option>
                                    {genres.map((g) => (
                                      <option key={g} value={g}>{g}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
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
                                  {savingId === song._id
                                    ? <><FaSpinner className="spinning" /> Đang lưu...</>
                                    : <><FaSave /> Lưu</>
                                  }
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
          )}

          {/* ══════════ TAB: TRASH ══════════ */}
          {activeTab === "trash" && (
            <div className="my-songs-content">
              <div className="trash-notice">
                <FaClock size={12} />
                <span>Bài hát sẽ bị xóa vĩnh viễn sau 7 ngày kể từ khi xóa</span>
              </div>

              {trashLoading ? (
                <div className="my-songs-loading">
                  <FaSpinner className="spinning" size={24} />
                  <p>Đang tải...</p>
                </div>
              ) : trashError ? (
                <div className="my-songs-error">
                  <p>{trashError}</p>
                  <button onClick={fetchTrash}>Thử lại</button>
                </div>
              ) : trashItems.length === 0 ? (
                <div className="my-songs-empty">
                  <FaTrash className="empty-icon" style={{ opacity: 0.25 }} />
                  <p>Thùng rác trống</p>
                </div>
              ) : (
                <div className="my-songs-list">
                  {trashItems.map((item) => {
                    const pct = Math.min(
                      100,
                      ((7 * 86400 - item.secondsLeft) / (7 * 86400)) * 100
                    );
                    return (
                      <div key={item._id} className="my-song-item trash-item-row">

                        {/* Cover mờ */}
                        <div className="song-cover-wrap trash-cover">
                          <img
                            src={getTrashCoverURL(item.songData)}
                            alt={item.songData?.title}
                            className="song-cover"
                            onError={(e) => { e.target.src = "/default-cover.jpg"; }}
                          />
                        </div>

                        {/* Info + timer */}
                        <div className="song-info trash-info">
                          <span className="song-title trash-title">
                            {item.songData?.title}
                          </span>
                          <span className="song-artist">
                            {item.songData?.artist || "Unknown"}
                          </span>
                          <div className="trash-timer">
                            <FaClock size={9} />
                            <span>Còn {formatTimeLeft(item.secondsLeft)}</span>
                          </div>
                          <div className="trash-bar-bg">
                            <div
                              className="trash-bar-fill"
                              style={{
                                width      : `${pct}%`,
                                background : getBarColor(item.secondsLeft),
                              }}
                            />
                          </div>
                        </div>

                        {/* ✅ Actions - chỉ 2 icon gọn */}
                        <div className="song-actions">
                          <button
                            className="action-restore"
                            onClick={() => handleRestore(item._id)}
                            disabled={restoringId === item._id}
                            title="Khôi phục"
                          >
                            {restoringId === item._id
                              ? <FaSpinner className="spinning" />
                              : <FaUndo />
                            }
                          </button>
                          <button
                            className="action-delete"
                            onClick={() => openPermanentDeleteModal(item)}
                            disabled={permDeletingId === item._id}
                            title="Xóa vĩnh viễn"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL XÁC NHẬN - nằm ngoài panel, không gây scroll */}
      <ConfirmModal
        isOpen    = {modal.isOpen}
        type      = {modal.type}
        songName  = {modal.songName}
        loading   = {modal.loading}
        onClose   = {() => setModal((p) => ({ ...p, isOpen: false }))}
        onConfirm = {modal.type === "soft" ? handleSoftDelete : handlePermanentDelete}
      />
    </>
  );
};

export default MySongsList;