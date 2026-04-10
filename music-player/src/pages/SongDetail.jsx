// src/pages/SongDetail.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaRegHeart,
  FaArrowLeft,
  FaEdit,
  FaHeadphones,
  FaMusic,
  FaCompactDisc,
  FaCalendarAlt,
  FaTimes,
  FaSave,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaVideo,
  FaAlignLeft,
  FaPlus, // ✅ THÊM
} from "react-icons/fa";
import songAPI from "../api/songAPI";
import { useMusicContext } from "../context/MusicContext";
import { useAuth } from "../context/AuthContext";
import AddToPlaylistModal from "../components/playlist/AddToPlaylistModal"; // ✅ THÊM
import "./SongDetail.css";
import getAvatarURL from "../utils/getAvatarURL";

const SongDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleFavorite,
    isFavorite,
    getCoverURL,
    fetchSongs,
    currentTime,
  } = useMusicContext();

  const [song, setSong]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [collapsed, setCollapsed]         = useState(false);
  const [activeTab, setActiveTab]         = useState(null);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [newLyrics, setNewLyrics]         = useState("");
  const [savingLyrics, setSavingLyrics]   = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false); // ✅ THÊM

  const videoRef = useRef(null);

  // ===== FETCH KHI id THAY ĐỔI =====
  useEffect(() => {
    const fetchSongDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await songAPI.getById(id);
        setSong(res.data);
        setNewLyrics(res.data.lyrics || "");
        setActiveTab(null);
      } catch (err) {
        setError("Không tìm thấy bài hát");
      } finally {
        setLoading(false);
      }
    };
    fetchSongDetail();
  }, [id]);

  // ===== LẮNG NGHE currentSong THAY ĐỔI =====
  useEffect(() => {
    if (!currentSong) return;
    if (currentSong._id !== id) {
      navigate(`/song/${currentSong._id}`, { replace: true });
    }
  }, [currentSong?._id]);

  // ===== ĐỒNG BỘ VIDEO - play/pause =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const isCurrentSong = currentSong && currentSong._id === song?._id;
    if (!isCurrentSong) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, currentSong, song]);

  // ===== ĐỒNG BỘ VIDEO - seek =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const isCurrentSong = currentSong && currentSong._id === song?._id;
    if (!isCurrentSong) return;

    const diff = Math.abs(video.currentTime - currentTime);
    if (diff > 2) {
      video.currentTime = currentTime;
    }
  }, [currentTime, currentSong, song]);

  const isCurrentSong       = currentSong && currentSong._id === song?._id;
  const isThisSongPlaying   = isCurrentSong && isPlaying;

  const handlePlay = () => {
    if (isCurrentSong) togglePlay();
    else playSong(song);
  };

  const handleTabToggle = (tab) => {
    if (tab === "video" && !videoURL) return;
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const openLyricsModal = () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thêm lời bài hát!");
      return;
    }
    setNewLyrics(song.lyrics || "");
    setShowLyricsModal(true);
  };

  const handleSaveLyrics = async () => {
    setSavingLyrics(true);
    try {
      const formData = new FormData();
      formData.append("lyrics", newLyrics);
      await songAPI.update(song._id, formData);
      setSong({ ...song, lyrics: newLyrics });
      setShowLyricsModal(false);
      fetchSongs();
    } catch (err) {
      alert("Lỗi khi lưu lời bài hát!");
    } finally {
      setSavingLyrics(false);
    }
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="song-detail-page">
        <div className="loading-container">
          <FaSpinner className="spinner-icon" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR =====
  if (error || !song) {
    return (
      <div className="song-detail-page">
        <div className="error-container">
          <p>{error || "Không tìm thấy bài hát"}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  const videoURL = songAPI.getVideoURL(song);

  return (
    <div className="song-detail-page">

      {/* ===== NÚT QUAY LẠI ===== */}
      <button onClick={() => navigate(-1)} className="back-button">
        <FaArrowLeft />
      </button>

      <div className={`song-detail-container ${collapsed ? "collapsed" : ""}`}>

        {/* ===== PANEL TRÁI ===== */}
        <div className={`song-info-section ${collapsed ? "is-collapsed" : ""}`}>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>

          <div className="panel-content">

            {/* ===== ĐĨA NHẠC ===== */}
            <div className="vinyl-wrapper">
              <div className={`vinyl-needle ${isThisSongPlaying ? "playing" : ""}`}>
                <div className="needle-base"></div>
                <div className="needle-arm"></div>
                <div className="needle-head"></div>
              </div>
              <div
                className={`vinyl-disk ${isThisSongPlaying ? "spinning" : ""}`}
                style={{ backgroundImage: `url(${getCoverURL(song)})` }}
              >
                <div className="vinyl-overlay"></div>
                <div className="vinyl-grooves">
                  <div className="vinyl-groove groove-1"></div>
                  <div className="vinyl-groove groove-2"></div>
                  <div className="vinyl-groove groove-3"></div>
                  <div className="vinyl-groove groove-4"></div>
                  <div className="vinyl-groove groove-5"></div>
                  <div className="vinyl-groove groove-6"></div>
                </div>
                <div className="vinyl-center-ring">
                  <div className="vinyl-hole"></div>
                </div>
                <div className="vinyl-shine"></div>
              </div>
            </div>

            {/* ===== THÔNG TIN ===== */}
            <div className="song-meta">
              <h1 className="song-detail-title">{song.title}</h1>
              <p className="song-detail-artist">{song.artist}</p>

              <div className="song-stats">
                <div className="stat-item">
                  <FaCompactDisc />
                  <span>{song.album || "Single"}</span>
                </div>
                <div className="stat-item">
                  <FaMusic />
                  <span>{song.genre || "Pop"}</span>
                </div>
                <div className="stat-item">
                  <FaHeadphones />
                  <span>{song.playCount || 0} lượt nghe</span>
                </div>
                <div className="stat-item">
                  <FaCalendarAlt />
                  <span>{formatDate(song.createdAt)}</span>
                </div>
              </div>

              {/* ===== ACTIONS ===== */}
              <div className="song-actions-detail">

                {/* Nút Play */}
                <button
                  className={`action-btn play-btn-large ${isThisSongPlaying ? "playing" : ""}`}
                  onClick={handlePlay}
                >
                  {isThisSongPlaying ? <FaPause /> : <FaPlay />}
                </button>

                {/* Nút Yêu thích */}
                <button
                  className={`action-btn fav-btn-large ${isFavorite(song._id) ? "liked" : ""}`}
                  onClick={() => toggleFavorite(song._id)}
                >
                  {isFavorite(song._id) ? <FaHeart /> : <FaRegHeart />}
                  {isFavorite(song._id) ? "Đã thích" : "Yêu thích"}
                </button>

                {/* ✅ Nút Thêm vào playlist */}
                {isAuthenticated && (
                  <button
                    className="action-btn add-pl-btn"
                    onClick={() => setShowAddModal(true)}
                    title="Thêm vào playlist"
                  >
                    <FaPlus />
                    Thêm vào playlist
                  </button>
                )}

              </div>

              {/* Uploader */}
              {song.uploadedBy && (
                <div className="uploader-info">
                  <img
                    src={getAvatarURL(song.uploadedBy.avatar, 30)}
                    alt="uploader"
                    className="uploader-avatar"
                    onError={(e) => { e.target.src = "https://i.pravatar.cc/30"; }}
                  />
                  <span>
                    Upload bởi <strong>{song.uploadedBy.username}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ===== MINI VIEW KHI COLLAPSED ===== */}
          <div className="mini-view" onClick={() => setCollapsed(false)}>
            <div className={`mini-vinyl ${isThisSongPlaying ? "spinning" : ""}`}>
              <div
                className="mini-vinyl-bg"
                style={{ backgroundImage: `url(${getCoverURL(song)})` }}
              />
              <div className="mini-vinyl-overlay" />
              <div className="mini-vinyl-hole" />
            </div>
            <div className="mini-info">
              <span className="mini-title">{song.title}</span>
              <span className="mini-artist">{song.artist}</span>
            </div>
            <button
              className="mini-play-btn"
              onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            >
              {isThisSongPlaying ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        </div>

        {/* ===== PANEL PHẢI ===== */}
        <div className="song-right-section">

          {/* ===== 2 ICON DỌC BÊN TRÁI ===== */}
          <div className="tab-icon-switcher">
            <button
              className={`tab-icon-btn ${activeTab === "lyrics" ? "active" : ""}`}
              onClick={() => handleTabToggle("lyrics")}
              title={activeTab === "lyrics" ? "Đóng lời bài hát" : "Lời bài hát"}
            >
              <FaAlignLeft />
            </button>

            <button
              className={`tab-icon-btn ${activeTab === "video" ? "active" : ""} ${!videoURL ? "disabled" : ""}`}
              onClick={() => handleTabToggle("video")}
              title={
                !videoURL
                  ? "Chưa có video"
                  : activeTab === "video"
                  ? "Đóng video"
                  : "Video"
              }
            >
              <FaVideo />
              {isThisSongPlaying && activeTab === "video" && videoURL && (
                <span className="playing-dot-icon" />
              )}
              {!videoURL && <span className="no-video-dot" />}
            </button>
          </div>

          {/* ===== TAB CONTENT ===== */}
          {activeTab !== null && (
            <div className="tab-content">

              {/* --- LYRICS --- */}
              {activeTab === "lyrics" && (
                <div className="song-lyrics-section">
                  <div className="lyrics-header">
                    <h2>🎤 Lời bài hát</h2>
                    {isAuthenticated && (
                      <button className="edit-lyrics-btn" onClick={openLyricsModal}>
                        <FaEdit /> {song.lyrics ? "Sửa lời" : "Thêm lời"}
                      </button>
                    )}
                  </div>
                  <div className="lyrics-content">
                    {song.lyrics ? (
                      <pre className="lyrics-text">{song.lyrics}</pre>
                    ) : (
                      <div className="no-lyrics">
                        <FaMusic className="no-lyrics-icon" />
                        <p>Chưa có lời bài hát</p>
                        {isAuthenticated ? (
                          <button className="add-lyrics-btn" onClick={openLyricsModal}>
                            <FaEdit /> Thêm lời bài hát
                          </button>
                        ) : (
                          <p className="login-hint">Đăng nhập để thêm lời bài hát</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- VIDEO --- */}
              {activeTab === "video" && (
                <div className="song-video-section">
                  {videoURL ? (
                    <div className="video-player-wrapper">
                      <video
                        ref={videoRef}
                        className="song-video-player"
                        src={videoURL}
                        poster={getCoverURL(song)}
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="video-overlay" onClick={handlePlay}>
                        <div className={`video-play-icon ${isThisSongPlaying ? "hide" : ""}`}>
                          <FaPlay />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-video">
                      <FaVideo className="no-video-icon" />
                      <p>Bài hát này chưa có video</p>
                      <span>Hãy upload video trong phần chỉnh sửa bài hát</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL LYRICS ===== */}
      {showLyricsModal && (
        <div
          className="lyrics-modal-overlay"
          onClick={() => setShowLyricsModal(false)}
        >
          <div className="lyrics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{song.lyrics ? "Sửa lời bài hát" : "Thêm lời bài hát"}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowLyricsModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-song-info">
                <strong>{song.title}</strong> - {song.artist}
              </p>
              <textarea
                className="lyrics-textarea"
                placeholder="Nhập lời bài hát tại đây..."
                value={newLyrics}
                onChange={(e) => setNewLyrics(e.target.value)}
                rows={15}
              />
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowLyricsModal(false)}
              >
                Hủy
              </button>
              <button
                className="modal-save-btn"
                onClick={handleSaveLyrics}
                disabled={savingLyrics}
              >
                {savingLyrics ? (
                  <><FaSpinner className="spinner" /> Đang lưu...</>
                ) : (
                  <><FaSave /> Lưu lời bài hát</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL THÊM VÀO PLAYLIST ===== */}
      {showAddModal && (
        <AddToPlaylistModal
          song={song}
          onClose={() => setShowAddModal(false)}
        />
      )}

    </div>
  );
};

export default SongDetail;