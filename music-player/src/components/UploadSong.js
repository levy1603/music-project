// src/components/UploadSong.js
import React, { useState, useRef, useEffect } from "react";
import {
  FaCloudUploadAlt, FaMusic, FaImage, FaVideo,
  FaSpinner, FaCheck, FaTimes, FaPlay,
  FaClock, FaCheckCircle, FaTimesCircle, FaHistory,
  FaChevronDown,
} from "react-icons/fa";
import songAPI from "../api/songAPI";
import { useMusicContext } from "../context/MusicContext";
import "./UploadSong.css";

/* ── Helpers ── */
const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_CONFIG = {
  pending:  { label: "Chờ duyệt", icon: <FaClock />,       color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)"   },
  approved: { label: "Đã duyệt",  icon: <FaCheckCircle />, color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.25)"   },
  rejected: { label: "Từ chối",   icon: <FaTimesCircle />, color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)"  },
};

/* ════════════════════════════════════════
   COMPONENT CHÍNH
════════════════════════════════════════ */
const UploadSong = () => {
  const { fetchSongs } = useMusicContext();

  /* ── Form state ── */
  const [formData, setFormData] = useState({
    title: "", artist: "", album: "", genre: "Pop", lyrics: "",
  });
  const [audioFile, setAudioFile]           = useState(null);
  const [coverFile, setCoverFile]           = useState(null);
  const [videoFile, setVideoFile]           = useState(null);
  const [coverPreview, setCoverPreview]     = useState(null);
  const [videoPreview, setVideoPreview]     = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [uploadResult, setUploadResult]     = useState(null);

  /* ── History state ── */
  const [myUploads, setMyUploads]         = useState([]);
  const [showHistory, setShowHistory]     = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]   = useState("");

  const videoRef = useRef(null);

  const genres = [
    "Pop", "Rock", "Ballad", "R&B", "Hip-Hop",
    "EDM", "Jazz", "Classical", "Indie", "Khác",
  ];

  /* ── Fetch lịch sử upload ── */
  const fetchMyUploads = async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await songAPI.getMySongs();
      console.log("📋 My uploads response:", res); // debug

      // ✅ Xử lý cả 2 dạng response
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (res.data?.success && Array.isArray(res.data.data)) {
        data = res.data.data;
      }

      console.log("📋 Parsed uploads:", data); // debug
      setMyUploads(data);
    } catch (err) {
      console.error("❌ Lỗi fetch my uploads:", err);
      setHistoryError("Không thể tải lịch sử upload");
      setMyUploads([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch khi component mount
  useEffect(() => {
    fetchMyUploads();
  }, []);

  /* ── File handlers ── */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) setAudioFile(file);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        setError("Video không được vượt quá 200MB!");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", artist: "", album: "", genre: "Pop", lyrics: "" });
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    removeVideo();
    setUploadProgress(0);
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploadResult(null);
    setUploadProgress(0);

    if (!audioFile)
      return setError("Vui lòng chọn file nhạc!");
    if (!formData.title || !formData.artist)
      return setError("Vui lòng nhập tên bài hát và nghệ sĩ!");

    setLoading(true);
    try {
      const data = new FormData();
      data.append("title",  formData.title);
      data.append("artist", formData.artist);
      data.append("album",  formData.album || "Single");
      data.append("genre",  formData.genre);
      data.append("lyrics", formData.lyrics);
      data.append("audio",  audioFile);
      if (coverFile) data.append("cover", coverFile);
      if (videoFile) data.append("video", videoFile);

      const res = await songAPI.create(data, (progress) => {
        setUploadProgress(progress);
      });

      console.log("✅ Upload result:", res); // debug

      setUploadResult({
        status:  "pending",
        title:   formData.title,
        message: res?.message || "Upload thành công! Đang chờ Admin duyệt.",
      });

      resetForm();

      // ✅ Refresh lịch sử sau khi upload
      await fetchMyUploads();
      setShowHistory(true); // Tự động mở lịch sử

    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.response?.data?.message || err.message || "Upload thất bại!");
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="upload-container">
      <h2 className="upload-title">
        <FaCloudUploadAlt /> Upload Bài Hát
      </h2>

      {/* Lỗi */}
      {error && (
        <div className="upload-error">
          <FaTimes /> {error}
        </div>
      )}

      {/* Thông báo chờ duyệt */}
      {uploadResult && (
        <div className="pending-notice">
          <div className="pending-notice-icon"><FaClock /></div>
          <div className="pending-notice-content">
            <h4>Upload thành công! 🎵</h4>
            <p>
              Bài hát <strong>"{uploadResult.title}"</strong> đang{" "}
              <span className="pending-highlight">chờ Admin duyệt</span>.
            </p>
            <p className="pending-notice-sub">
              Bài hát sẽ xuất hiện công khai sau khi được phê duyệt.
              Xem trạng thái bên dưới.
            </p>
          </div>
          <button
            className="pending-notice-close"
            onClick={() => setUploadResult(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Form upload */}
      <form onSubmit={handleSubmit} className="upload-form">

        {/* PHẦN 1: Audio + Cover */}
        <div className="upload-section">
          <h3 className="section-title"><FaMusic /> Thông tin nhạc</h3>
          <div className="upload-files">
            <label className={`file-upload-box ${audioFile ? "has-file" : ""}`}>
              <FaMusic className="file-icon" />
              {audioFile ? (
                <div className="file-info">
                  <span className="file-name">{audioFile.name}</span>
                  <span className="file-size">{formatFileSize(audioFile.size)}</span>
                </div>
              ) : (
                <>
                  <span>Chọn file nhạc</span>
                  <small>MP3, WAV, FLAC (tối đa 20MB)</small>
                </>
              )}
              <input type="file" accept="audio/*" onChange={handleAudioChange} hidden />
            </label>

            <label className="file-upload-box cover-box">
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="cover-preview" />
              ) : (
                <>
                  <FaImage className="file-icon" />
                  <span>Chọn ảnh bìa</span>
                  <small>JPG, PNG, WEBP (tối đa 5MB)</small>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleCoverChange} hidden />
            </label>
          </div>
        </div>

        {/* PHẦN 2: Video */}
        <div className="upload-section">
          <h3 className="section-title">
            <FaVideo /> Video bài hát
            <span className="optional-badge">Không bắt buộc</span>
          </h3>
          {!videoPreview ? (
            <label className="video-upload-box">
              <div className="video-upload-inner">
                <FaVideo className="video-upload-icon" />
                <p>Kéo thả hoặc nhấn để chọn video</p>
                <small>MP4, WEBM, MOV, AVI (tối đa 200MB)</small>
                <div className="video-upload-btn">
                  <FaCloudUploadAlt /> Chọn video
                </div>
              </div>
              <input type="file" accept="video/*" onChange={handleVideoChange} hidden />
            </label>
          ) : (
            <div className="video-preview-wrapper">
              <video ref={videoRef} src={videoPreview}
                className="video-preview" controls preload="metadata" />
              <div className="video-file-info">
                <div className="video-file-detail">
                  <FaVideo />
                  <div>
                    <span className="video-file-name">{videoFile?.name}</span>
                    <span className="video-file-size">
                      {videoFile ? formatFileSize(videoFile.size) : ""}
                    </span>
                  </div>
                </div>
                <div className="video-actions">
                  <label className="change-video-btn">
                    <FaPlay /> Đổi video
                    <input type="file" accept="video/*"
                      onChange={handleVideoChange} hidden />
                  </label>
                  <button type="button" className="remove-video-btn" onClick={removeVideo}>
                    <FaTimes /> Xóa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PHẦN 3: Thông tin bài hát */}
        <div className="upload-section">
          <h3 className="section-title"><FaMusic /> Chi tiết bài hát</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tên bài hát *</label>
              <input type="text" name="title" value={formData.title}
                onChange={handleChange} placeholder="Nhập tên bài hát" required />
            </div>
            <div className="form-group">
              <label>Nghệ sĩ *</label>
              <input type="text" name="artist" value={formData.artist}
                onChange={handleChange} placeholder="Nhập tên nghệ sĩ" required />
            </div>
            <div className="form-group">
              <label>Album</label>
              <input type="text" name="album" value={formData.album}
                onChange={handleChange} placeholder="Single" />
            </div>
            <div className="form-group">
              <label>Thể loại</label>
              <select name="genre" value={formData.genre} onChange={handleChange}>
                {genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Lời bài hát</label>
            <textarea name="lyrics" value={formData.lyrics} onChange={handleChange}
              placeholder="Nhập lời bài hát..." rows="5" />
          </div>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="upload-progress-wrapper">
            <div className="upload-progress-info">
              <span>Đang upload...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill"
                style={{ width: `${uploadProgress}%` }} />
            </div>
            {videoFile && (
              <p className="upload-progress-note">
                📹 Video đang được upload, vui lòng không đóng trang...
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <button type="submit" className="upload-btn" disabled={loading}>
          {loading
            ? <><FaSpinner className="spinner" /> Đang upload...</>
            : <><FaCloudUploadAlt /> Upload bài hát</>
          }
        </button>
      </form>

      {/* ✅ LỊCH SỬ UPLOAD */}
      <UploadHistory
        uploads={myUploads}
        loading={historyLoading}
        error={historyError}
        show={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
        onRefresh={fetchMyUploads}
      />
    </div>
  );
};

/* ════════════════════════════════════════
   SUB-COMPONENT: Lịch sử upload
════════════════════════════════════════ */
const UploadHistory = ({ uploads, loading, error, show, onToggle, onRefresh }) => {
  const pendingCount  = uploads.filter((u) => u.status === "pending").length;
  const approvedCount = uploads.filter((u) => u.status === "approved").length;
  const rejectedCount = uploads.filter((u) => u.status === "rejected").length;

  return (
    <div className="upload-history">

      {/* Toggle header */}
      <button className="history-toggle-btn" onClick={onToggle}>
        <FaHistory />
        <span>Lịch sử upload của bạn</span>

        {/* Badges */}
        <div className="history-badges">
          {uploads.length > 0 && (
            <span className="history-total-badge">{uploads.length}</span>
          )}
          {pendingCount > 0 && (
            <span className="history-status-badge badge-pending-sm">
              <FaClock /> {pendingCount} chờ
            </span>
          )}
          {rejectedCount > 0 && (
            <span className="history-status-badge badge-rejected-sm">
              <FaTimesCircle /> {rejectedCount} từ chối
            </span>
          )}
        </div>

        <FaChevronDown className={`history-chevron ${show ? "open" : ""}`} />
      </button>

      {/* Content */}
      {show && (
        <div className="history-content">

          {/* Pending warning */}
          {pendingCount > 0 && (
            <div className="history-pending-note">
              <FaClock />
              <span>
                Bạn có <strong>{pendingCount}</strong> bài đang chờ Admin duyệt
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="history-error">
              <FaTimes /> {error}
              <button onClick={onRefresh}>Thử lại</button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="history-loading">
              <FaSpinner className="spinner" /> Đang tải lịch sử...
            </div>
          ) : uploads.length === 0 ? (
            <div className="history-empty">
              <FaMusic />
              <p>Chưa có bài hát nào được upload</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="history-summary">
                <div className="history-summary-item summary-approved">
                  <FaCheckCircle /> {approvedCount} đã duyệt
                </div>
                <div className="history-summary-item summary-pending">
                  <FaClock /> {pendingCount} chờ duyệt
                </div>
                <div className="history-summary-item summary-rejected">
                  <FaTimesCircle /> {rejectedCount} từ chối
                </div>
              </div>

              {/* List */}
              <div className="history-list">
                {uploads.map((song) => {
                  const cfg = STATUS_CONFIG[song.status] || STATUS_CONFIG.pending;
                  const coverURL = song.coverImage && song.coverImage !== "default-cover.jpg"
                    ? `http://localhost:5000/uploads/covers/${song.coverImage}`
                    : null;

                  return (
                    <div
                      key={song._id}
                      className="history-item"
                      style={{ borderColor: cfg.border }}
                    >
                      {/* Cover */}
                      <div className="history-cover">
                        {coverURL ? (
                          <img
                            src={coverURL}
                            alt={song.title}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <FaMusic />
                        )}
                      </div>

                      {/* Info */}
                      <div className="history-info">
                        <span className="history-title">{song.title}</span>
                        <span className="history-artist">{song.artist}</span>
                        <span className="history-date">
                          {formatDate(song.createdAt)}
                        </span>

                        {/* Lý do từ chối */}
                        {song.status === "rejected" && song.rejectReason && (
                          <span className="history-reject-reason">
                            ⚠️ {song.rejectReason}
                          </span>
                        )}
                      </div>

                      {/* Status badge */}
                      <div
                        className="history-status-badge-box"
                        style={{
                          color:       cfg.color,
                          background:  cfg.bg,
                          border:      `1px solid ${cfg.border}`,
                        }}
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Refresh button */}
          <button className="history-refresh-btn" onClick={onRefresh}>
            🔄 Làm mới danh sách
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadSong;