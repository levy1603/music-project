// src/components/admin/AdminUploads.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaCloudUploadAlt, FaMusic, FaCheckCircle,
  FaTimesCircle, FaTrash, FaSearch, FaFilter,
  FaEye, FaClock, FaUser, FaSpinner, FaSync,
  FaExclamationTriangle, FaVideo, FaBell,
  FaMicrophone, FaTag, FaCalendarAlt,
  FaAlignLeft,
} from "react-icons/fa";
import songAPI from "../../api/songAPI";
import ConfirmModal from "../common/ConfirmModal";
import ToastMessage from "../common/ToastMessage";
import "./AdminUploads.css";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONSTANTS & HELPERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const STATUS_CONFIG = {
  pending:  { label: "Chá» duyá»‡t", className: "badge-pending",  icon: <FaClock /> },
  approved: { label: "ÄÃ£ duyá»‡t",  className: "badge-approved", icon: <FaCheckCircle /> },
  rejected: { label: "Tá»« chá»‘i",   className: "badge-rejected", icon: <FaTimesCircle /> },
};

const INITIAL_TOAST = {
  open: false,
  type: "info",
  message: "",
};

const formatDuration = (seconds) => {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatDate = (iso) => {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const getImageURL = (song) => {
  if (!song?.coverImage || song.coverImage === "default-cover.jpg") return null;
  if (song.coverImage.startsWith("http")) return song.coverImage;
  return `http://localhost:5000/uploads/covers/${song.coverImage}`;
};

const getAudioURL = (song) => {
  if (!song?.audioFile) return null;
  if (song.audioFile.startsWith("http")) return song.audioFile;
  return `http://localhost:5000/uploads/songs/${song.audioFile}`;
};

const getVideoURL = (song) => {
  if (!song?.videoFile || song.videoFile === "") return null;
  if (song.videoFile.startsWith("http")) return song.videoFile;
  return `http://localhost:5000/uploads/videos/${song.videoFile}`;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const AdminUploads = ({ highlightSongId, onClearHighlight }) => {
  const [uploads,       setUploads]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [searchTerm,    setSearchTerm]    = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [selected,      setSelected]      = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal,   setRejectModal]   = useState(null);
  const [rejectReason,  setRejectReason]  = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,         setToast]         = useState(INITIAL_TOAST);
  const [stats,         setStats]         = useState({
    total: 0, pending: 0, approved: 0, rejected: 0,
  });

  const highlightRowRef = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({ open: true, type, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast(INITIAL_TOAST);
  }, []);

  /* â”€â”€ Fetch â”€â”€ */
  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params    = filterStatus !== "all" ? { status: filterStatus } : {};
      const res       = await songAPI.adminGetAllUploads(params);
      const data      = res.data?.data  || res.data || [];
      const statsData = res.data?.stats || {};

      setUploads(Array.isArray(data) ? data : []);
      setStats({
        total:    statsData.pending + statsData.approved + statsData.rejected || data.length,
        pending:  statsData.pending  || 0,
        approved: statsData.approved || 0,
        rejected: statsData.rejected || 0,
      });
    } catch (err) {
      console.error("Lá»—i fetch uploads:", err);
      setError("KhÃ´ng thá»ƒ táº£i danh sÃ¡ch upload. Vui lÃ²ng thá»­ láº¡i.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);

  /* â”€â”€ Auto scroll khi cÃ³ highlight â”€â”€ */
  useEffect(() => {
    if (!highlightSongId || loading) return;
    const targetSong = uploads.find((u) => u._id === highlightSongId);
    if (targetSong && filterStatus !== "all" && filterStatus !== targetSong.status) {
      setFilterStatus("all");
    }
    const timer = setTimeout(() => {
      highlightRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightSongId, loading, uploads, filterStatus]);

  /* â”€â”€ Filter â”€â”€ */
  const filtered = uploads.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.title?.toLowerCase().includes(term)               ||
      u.artist?.toLowerCase().includes(term)              ||
      u.featuring?.toLowerCase().includes(term)           ||
      u.uploadedBy?.username?.toLowerCase().includes(term)||
      u.tags?.some((t) => t.toLowerCase().includes(term))
    );
  });

  /* Actions */
  const handleApprove = useCallback(async (id) => {
    setActionLoading(id);
    try {
      const res = await songAPI.adminApproveSong(id);
      const updated = res.data?.data || res.data;
      setUploads((prev) => prev.map((u) => (u._id === id ? { ...u, ...updated } : u)));
      setStats((prev) => ({ ...prev, approved: prev.approved + 1, pending: Math.max(0, prev.pending - 1) }));
      if (selected?._id === id) setSelected((prev) => ({ ...prev, ...updated }));
      if (id === highlightSongId) onClearHighlight?.();
      showToast("success", "Da duyet bai hat.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Duyet that bai!");
    } finally {
      setActionLoading(null);
    }
  }, [selected, highlightSongId, onClearHighlight, showToast]);

  const openRejectModal = (upload) => {
    setRejectModal({ id: upload._id, title: upload.title });
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    const { id } = rejectModal;
    setActionLoading(id);
    setRejectModal(null);
    try {
      const res = await songAPI.adminRejectSong(id, rejectReason);
      const updated = res.data?.data || res.data;
      setUploads((prev) => prev.map((u) => (u._id === id ? { ...u, ...updated } : u)));
      setStats((prev) => ({ ...prev, rejected: prev.rejected + 1, pending: Math.max(0, prev.pending - 1) }));
      if (selected?._id === id) setSelected((prev) => ({ ...prev, ...updated }));
      if (id === highlightSongId) onClearHighlight?.();
      showToast("success", "Da tu choi bai hat.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Tu choi that bai!");
    } finally {
      setActionLoading(null);
      setRejectReason("");
    }
  };

  const handleDelete = useCallback((id) => {
    const song = uploads.find((item) => item._id === id);
    setDeleteConfirm({
      id,
      title: song?.title || "upload nay",
    });
  }, [uploads]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;

    const { id } = deleteConfirm;
    setActionLoading(id);
    try {
      await songAPI.adminDeleteSong(id);
      setUploads((prev) => prev.filter((u) => u._id !== id));
      setStats((prev) => {
        const song = uploads.find((u) => u._id === id);
        return { ...prev, total: Math.max(0, prev.total - 1), [song?.status]: Math.max(0, prev[song?.status] - 1) };
      });
      if (selected?._id === id) setSelected(null);
      if (highlightSongId === id) onClearHighlight?.();
      setDeleteConfirm(null);
      showToast("success", "Da xoa upload.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Xoa that bai!");
    } finally {
      setActionLoading(null);
    }
  }, [deleteConfirm, selected, uploads, highlightSongId, onClearHighlight, showToast]);

  /* Loading / Error */
  if (loading) {
    return (
      <div className="au-loading">
        <div className="au-spinner" />
        <span>Äang táº£i danh sÃ¡ch upload...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="au-error-state">
        <FaExclamationTriangle />
        <p>{error}</p>
        <button className="au-retry-btn" onClick={fetchUploads}>
          <FaSync /> Thá»­ láº¡i
        </button>
      </div>
    );
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <div className="au-wrapper">

      {/* Header */}
      <div className="au-header">
        <div className="au-header-left">
          <FaCloudUploadAlt className="au-header-icon" />
          <div>
            <h1 className="au-title">Quáº£n lÃ½ Upload</h1>
            <p className="au-subtitle">Duyá»‡t vÃ  quáº£n lÃ½ cÃ¡c bÃ i hÃ¡t Ä‘Æ°á»£c táº£i lÃªn</p>
          </div>
        </div>
        <button className="au-refresh-btn" onClick={fetchUploads}>
          <FaSync /> LÃ m má»›i
        </button>
      </div>

      {/* Highlight banner */}
      {highlightSongId && (
        <div className="au-highlight-banner">
          <div className="au-highlight-banner-left">
            <FaBell className="au-highlight-bell" />
            <span>
              Báº¡n Ä‘ang xem bÃ i hÃ¡t tá»« thÃ´ng bÃ¡o â€”
              <strong> cuá»™n xuá»‘ng Ä‘á»ƒ tÃ¬m bÃ i Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u</strong>
            </span>
          </div>
          <button className="au-highlight-banner-close" onClick={onClearHighlight}>âœ•</button>
        </div>
      )}

      {/* Stats */}
      <div className="au-stats-grid">
        {[
          { label: "Tá»•ng upload", value: stats.pending + stats.approved + stats.rejected, color: "blue",   icon: <FaCloudUploadAlt /> },
          { label: "Chá» duyá»‡t",   value: stats.pending,                                  color: "yellow", icon: <FaClock /> },
          { label: "ÄÃ£ duyá»‡t",    value: stats.approved,                                 color: "green",  icon: <FaCheckCircle /> },
          { label: "Tá»« chá»‘i",     value: stats.rejected,                                 color: "red",    icon: <FaTimesCircle /> },
        ].map((card) => (
          <div key={card.label} className={`au-stat-card au-stat-${card.color}`}>
            <div className="au-stat-icon">{card.icon}</div>
            <div className="au-stat-info">
              <span className="au-stat-value">{card.value}</span>
              <span className="au-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="au-toolbar">
        <div className="au-search-box">
          <FaSearch className="au-search-icon" />
          <input
            type="text"
            placeholder="TÃ¬m theo tÃªn bÃ i, nghá»‡ sÄ©, tag, ngÆ°á»i upload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="au-search-input"
          />
          {searchTerm && (
            <button className="au-search-clear" onClick={() => setSearchTerm("")}>âœ•</button>
          )}
        </div>
        <div className="au-filter-group">
          <FaFilter className="au-filter-icon" />
          {[
            { key: "all",      label: "Táº¥t cáº£"    },
            { key: "pending",  label: "Chá» duyá»‡t" },
            { key: "approved", label: "ÄÃ£ duyá»‡t"  },
            { key: "rejected", label: "Tá»« chá»‘i"   },
          ].map((f) => (
            <button
              key={f.key}
              className={`au-filter-btn ${filterStatus === f.key ? "active" : ""}`}
              onClick={() => setFilterStatus(f.key)}
            >
              {f.label}
              {f.key !== "all" && stats[f.key] > 0 && (
                <span className="au-filter-count">{stats[f.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="au-table-wrapper">
        {filtered.length === 0 ? (
          <div className="au-empty">
            <FaCloudUploadAlt />
            <p>
              {searchTerm
                ? `KhÃ´ng tÃ¬m tháº¥y káº¿t quáº£ cho "${searchTerm}"`
                : "KhÃ´ng cÃ³ upload nÃ o"}
            </p>
          </div>
        ) : (
          <table className="au-table">
            <thead>
              <tr>
                <th>BÃ i hÃ¡t</th>
                <th>NgÆ°á»i upload</th>
                <th>Thá»ƒ loáº¡i / NÄƒm</th>
                <th>Thá»i lÆ°á»£ng</th>
                <th>NgÃ y upload</th>
                <th>Tráº¡ng thÃ¡i</th>
                <th>Thao tÃ¡c</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((upload) => {
                const statusCfg     = STATUS_CONFIG[upload.status] || STATUS_CONFIG.pending;
                const isLoading     = actionLoading === upload._id;
                const coverURL      = getImageURL(upload);
                const isHighlighted = upload._id === highlightSongId;

                return (
                  <tr
                    key={upload._id}
                    ref={isHighlighted ? highlightRowRef : null}
                    className={`au-table-row
                      ${isLoading     ? "au-row-loading"     : ""}
                      ${selected?._id === upload._id ? "au-row-selected"   : ""}
                      ${isHighlighted ? "au-row-highlighted" : ""}
                    `}
                  >
                    {/* BÃ i hÃ¡t */}
                    <td>
                      <div className="au-song-cell">
                        <div className="au-cover">
                          {coverURL ? (
                            <img src={coverURL} alt={upload.title}
                              onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <FaMusic className="au-cover-placeholder" />
                          )}
                        </div>
                        <div className="au-song-info">
                          {isHighlighted && (
                            <span className="au-highlighted-tag">
                              <FaBell /> Tá»« thÃ´ng bÃ¡o
                            </span>
                          )}
                          <span className="au-song-title">{upload.title}</span>

                          {/* âœ… Featuring */}
                          <span className="au-song-artist">
                            {upload.artist}
                            {upload.featuring && (
                              <span className="au-featuring"> ft. {upload.featuring}</span>
                            )}
                          </span>

                          {/* âœ… Tags */}
                          {upload.tags?.length > 0 && (
                            <div className="au-song-tags">
                              {upload.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="au-song-tag">#{tag}</span>
                              ))}
                              {upload.tags.length > 3 && (
                                <span className="au-song-tag-more">+{upload.tags.length - 3}</span>
                              )}
                            </div>
                          )}

                          {/* âœ… Badges: LRC + Video */}
                          <div className="au-song-badges">
                            {upload.lrc && (
                              <span className="au-badge-mini au-badge-lrc">
                                <FaMicrophone /> LRC
                              </span>
                            )}
                            {upload.videoFile && (
                              <span className="au-badge-mini au-badge-video">
                                <FaVideo /> MV
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* NgÆ°á»i upload */}
                    <td>
                      <div className="au-uploader-cell">
                        <FaUser className="au-uploader-icon" />
                        <span>{upload.uploadedBy?.username || "N/A"}</span>
                      </div>
                    </td>

                    {/* âœ… Thá»ƒ loáº¡i + NgÃ´n ngá»¯ */}
                    <td>
                      <div className="au-genre-lang">
                        <span className="au-genre-tag">{upload.genre || "N/A"}</span>
                        {upload.releaseYear && (
                          <span className="au-year-tag">{upload.releaseYear}</span>
                        )}
                      </div>
                    </td>

                    {/* Thá»i lÆ°á»£ng */}
                    <td className="au-duration">{formatDuration(upload.duration)}</td>

                    {/* NgÃ y upload */}
                    <td className="au-date">{formatDate(upload.createdAt)}</td>

                    {/* Tráº¡ng thÃ¡i */}
                    <td>
                      <span className={`au-badge ${statusCfg.className}`}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                      {upload.status === "rejected" && upload.rejectReason && (
                        <p className="au-reject-reason-preview">{upload.rejectReason}</p>
                      )}
                    </td>

                    {/* Thao tÃ¡c */}
                    <td>
                      <div className="au-actions">
                        <button
                          className="au-btn au-btn-view"
                          onClick={() => setSelected(upload)}
                          title="Xem chi tiáº¿t"
                          disabled={isLoading}
                        >
                          {isLoading ? <FaSpinner className="au-spin" /> : <FaEye />}
                        </button>
                        {upload.status !== "approved" && (
                          <button
                            className="au-btn au-btn-approve"
                            onClick={() => handleApprove(upload._id)}
                            title="Duyá»‡t bÃ i"
                            disabled={isLoading}
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                        {upload.status !== "rejected" && (
                          <button
                            className="au-btn au-btn-reject"
                            onClick={() => openRejectModal(upload)}
                            title="Tá»« chá»‘i"
                            disabled={isLoading}
                          >
                            <FaTimesCircle />
                          </button>
                        )}
                        <button
                          className="au-btn au-btn-delete"
                          onClick={() => handleDelete(upload._id)}
                          title="XoÃ¡"
                          disabled={isLoading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {searchTerm && filtered.length > 0 && (
        <p className="au-search-result">
          TÃ¬m tháº¥y <strong>{filtered.length}</strong> káº¿t quáº£ cho "{searchTerm}"
        </p>
      )}

      {/* Modals */}
      {selected && (
        <UploadDetailModal
          upload={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={openRejectModal}
          onDelete={handleDelete}
          actionLoading={actionLoading}
        />
      )}
      {rejectModal && (
        <RejectReasonModal
          title={rejectModal.title}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onConfirm={handleRejectConfirm}
          onCancel={() => { setRejectModal(null); setRejectReason(""); }}
        />
      )}
      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title="Xoa upload"
        message={
          deleteConfirm
            ? `Ban co chac muon xoa "${deleteConfirm.title}"?`
            : ""
        }
        confirmText="Xoa upload"
        cancelText="Huy"
        confirmVariant="danger"
        loading={actionLoading === deleteConfirm?.id}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          if (!actionLoading) setDeleteConfirm(null);
        }}
      />
      <ToastMessage
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MODAL: Chi tiáº¿t upload
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const UploadDetailModal = ({
  upload, onClose, onApprove, onReject, onDelete, actionLoading,
}) => {
  const statusCfg = STATUS_CONFIG[upload.status] || STATUS_CONFIG.pending;
  const isLoading = actionLoading === upload._id;
  const coverURL  = getImageURL(upload);
  const audioURL  = getAudioURL(upload);
  const videoURL  = getVideoURL(upload);

  const [activeTab, setActiveTab] = useState("info");

  /* âœ… Tá»± Ä‘á»™ng chuyá»ƒn tab náº¿u tab hiá»‡n táº¡i khÃ´ng cÃ²n há»£p lá»‡ */
  useEffect(() => {
    if (activeTab === "video"  && !videoURL)      setActiveTab("info");
    if (activeTab === "lyrics" && !upload.lyrics) setActiveTab("info");
    if (activeTab === "lrc"    && !upload.lrc)    setActiveTab("info");
  }, [activeTab, videoURL, upload.lyrics, upload.lrc]);

  /* Tabs config */
  const tabs = [
    { key: "info",   label: "ThÃ´ng tin",    icon: <FaMusic />,      always: true  },
    { key: "audio",  label: "Nghe thá»­",     icon: <>ðŸŽ§</>,          always: !!audioURL },
    { key: "video",  label: "Video MV",     icon: <FaVideo />,      always: !!videoURL },
    { key: "lyrics", label: "Lá»i bÃ i hÃ¡t",  icon: <FaAlignLeft />,  always: !!upload.lyrics },
    { key: "lrc",    label: "LRC Karaoke",  icon: <FaMicrophone />, always: !!upload.lrc },
  ].filter((t) => t.always);

  return (
    <div className="au-modal-overlay" onClick={onClose}>
      <div className="au-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="au-modal-header">
          <h2>Chi tiáº¿t Upload</h2>
          <button className="au-modal-close" onClick={onClose}>âœ•</button>
        </div>

        {/* Top: Cover + Info */}
        <div className="au-modal-top">
          <div className="au-modal-cover">
            {coverURL ? (
              <img src={coverURL} alt={upload.title} />
            ) : (
              <div className="au-modal-cover-placeholder"><FaMusic /></div>
            )}
          </div>

          <div className="au-modal-summary">
            <h3 className="au-modal-title">{upload.title}</h3>

            {/* âœ… Featuring */}
            <p className="au-modal-artist">
              {upload.artist}
              {upload.featuring && (
                <span className="au-modal-featuring"> ft. {upload.featuring}</span>
              )}
            </p>

            <span className={`au-badge ${statusCfg.className}`}>
              {statusCfg.icon} {statusCfg.label}
            </span>

            {upload.status === "rejected" && upload.rejectReason && (
              <div className="au-modal-reject-reason">
                <FaExclamationTriangle />
                <span>{upload.rejectReason}</span>
              </div>
            )}

            {/* âœ… Quick meta vá»›i cÃ¡c field má»›i */}
            <div className="au-modal-quick-meta">
              <span><FaUser /> {upload.uploadedBy?.username || "N/A"}</span>
              <span>ðŸŽµ {upload.genre || "N/A"}</span>
              {upload.releaseYear && <span><FaCalendarAlt /> {upload.releaseYear}</span>}
              <span>â± {formatDuration(upload.duration)}</span>
              {videoURL && <span className="au-has-video-tag"><FaVideo /> CÃ³ MV</span>}
              {upload.lrc && <span className="au-has-lrc-tag"><FaMicrophone /> CÃ³ LRC</span>}
            </div>

            {/* âœ… Tags */}
            {upload.tags?.length > 0 && (
              <div className="au-modal-tags">
                <FaTag className="au-modal-tags-icon" />
                {upload.tags.map((tag) => (
                  <span key={tag} className="au-modal-tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="au-modal-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`au-modal-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="au-modal-tab-content">

          {/* Tab: ThÃ´ng tin */}
          {activeTab === "info" && (
            <div className="au-modal-meta">
              {[
                { label: "NgÆ°á»i upload", value: upload.uploadedBy?.username || "N/A"    },
                { label: "Email",        value: upload.uploadedBy?.email    || "N/A"    },
                { label: "Nghá»‡ sÄ© ft.",  value: upload.featuring            || "KhÃ´ng cÃ³" },
                { label: "Album",        value: upload.album                || "Single" },
                { label: "Thá»ƒ loáº¡i",     value: upload.genre                || "N/A"    },
                { label: "NÄƒm phÃ¡t hÃ nh",value: upload.releaseYear          || "N/A"    },
                { label: "Thá»i lÆ°á»£ng",   value: formatDuration(upload.duration)         },
                { label: "NgÃ y upload",  value: formatDate(upload.createdAt)            },
                { label: "File video",   value: videoURL ? "âœ… CÃ³ video MV"  : "âŒ KhÃ´ng cÃ³" },
                { label: "LRC Karaoke",  value: upload.lrc ? `âœ… CÃ³ (${upload.lrc.split("\n").length} dÃ²ng)` : "âŒ KhÃ´ng cÃ³" },
                { label: "Tags",         value: upload.tags?.length > 0 ? upload.tags.map(t => `#${t}`).join("  ") : "KhÃ´ng cÃ³" },
                ...(upload.reviewedBy ? [
                  { label: "NgÆ°á»i duyá»‡t", value: upload.reviewedBy?.username  },
                  { label: "NgÃ y duyá»‡t",  value: formatDate(upload.reviewedAt) },
                ] : []),
              ].map((row) => (
                <div key={row.label} className="au-meta-row">
                  <span className="au-meta-label">{row.label}</span>
                  <span className="au-meta-value">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Nghe thá»­ */}
          {activeTab === "audio" && audioURL && (
            <div className="au-tab-audio">
              <div className="au-audio-cover">
                {coverURL ? (
                  <img src={coverURL} alt={upload.title} />
                ) : (
                  <div className="au-audio-cover-placeholder"><FaMusic /></div>
                )}
                <div className="au-audio-wave">
                  <span /><span /><span /><span /><span />
                </div>
              </div>
              <p className="au-audio-song-name">
                {upload.title}
                {upload.featuring && <span className="au-audio-featuring"> ft. {upload.featuring}</span>}
                {" â€” "}{upload.artist}
              </p>
              <audio controls src={audioURL} className="au-audio-player" preload="metadata" />
            </div>
          )}

          {/* Tab: Video MV */}
          {activeTab === "video" && videoURL && (
            <div className="au-tab-video">
              <div className="au-video-container">
                <video
                  controls src={videoURL}
                  className="au-video-player"
                  preload="metadata"
                  poster={coverURL || undefined}
                >
                  TrÃ¬nh duyá»‡t khÃ´ng há»— trá»£ video.
                </video>
              </div>
              <div className="au-video-info">
                <FaVideo className="au-video-info-icon" />
                <div>
                  <p className="au-video-info-title">{upload.title} â€” MV</p>
                  <p className="au-video-info-sub">{upload.videoFile}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Lá»i bÃ i hÃ¡t */}
          {activeTab === "lyrics" && upload.lyrics && (
            <div className="au-tab-lyrics">
              <pre className="au-lyrics-content">{upload.lyrics}</pre>
            </div>
          )}

          {/* âœ… Tab: LRC Karaoke */}
          {activeTab === "lrc" && upload.lrc && (
            <div className="au-tab-lrc">
              <div className="au-lrc-header">
                <FaMicrophone className="au-lrc-icon" />
                <div>
                  <span className="au-lrc-title">Lá»i Ä‘á»“ng bá»™ (LRC / Karaoke)</span>
                  <span className="au-lrc-count">
                    {upload.lrc.split("\n").filter((l) => l.trim()).length} dÃ²ng
                  </span>
                </div>
              </div>

              {/* Parse vÃ  hiá»ƒn thá»‹ LRC dáº¡ng Ä‘áº¹p */}
              <div className="au-lrc-lines">
                {upload.lrc
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line, i) => {
                    // Parse timestamp [mm:ss.xx]
                    const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
                    if (match) {
                      return (
                        <div key={i} className="au-lrc-line">
                          <span className="au-lrc-time">[{match[1]}]</span>
                          <span className="au-lrc-text">{match[2]}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="au-lrc-line au-lrc-line-raw">
                        <span className="au-lrc-text">{line}</span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="au-modal-footer">
          {upload.status !== "approved" && (
            <button
              className="au-modal-btn au-modal-btn-approve"
              onClick={() => onApprove(upload._id)}
              disabled={isLoading}
            >
              {isLoading
                ? <><FaSpinner className="au-spin" /> Äang xá»­ lÃ½...</>
                : <><FaCheckCircle /> Duyá»‡t bÃ i</>
              }
            </button>
          )}
          {upload.status !== "rejected" && (
            <button
              className="au-modal-btn au-modal-btn-reject"
              onClick={() => onReject(upload)}
              disabled={isLoading}
            >
              <FaTimesCircle /> Tá»« chá»‘i
            </button>
          )}
          <button
            className="au-modal-btn au-modal-btn-delete"
            onClick={() => onDelete(upload._id)}
            disabled={isLoading}
          >
            <FaTrash /> XoÃ¡
          </button>
          <button className="au-modal-btn au-modal-btn-cancel" onClick={onClose}>
            ÄÃ³ng
          </button>
        </div>
      </div>
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MODAL: Tá»« chá»‘i
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const RejectReasonModal = ({ title, reason, onReasonChange, onConfirm, onCancel }) => {
  const QUICK_REASONS = [
    "Cháº¥t lÆ°á»£ng Ã¢m thanh kÃ©m",
    "Ná»™i dung vi pháº¡m báº£n quyá»n",
    "ThÃ´ng tin bÃ i hÃ¡t khÃ´ng chÃ­nh xÃ¡c",
    "File bá»‹ lá»—i hoáº·c khÃ´ng phÃ¡t Ä‘Æ°á»£c",
    "Ná»™i dung khÃ´ng phÃ¹ há»£p",
  ];

  return (
    <div className="au-modal-overlay" onClick={onCancel}>
      <div className="au-reject-modal" onClick={(e) => e.stopPropagation()}>
        <div className="au-modal-header">
          <h2><FaTimesCircle /> Tá»« chá»‘i bÃ i hÃ¡t</h2>
          <button className="au-modal-close" onClick={onCancel}>âœ•</button>
        </div>

        <div className="au-reject-modal-body">
          <p className="au-reject-song-name">BÃ i hÃ¡t: <strong>"{title}"</strong></p>
          <p className="au-reject-quick-label">Chá»n nhanh:</p>
          <div className="au-reject-quick-list">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                className={`au-reject-quick-btn ${reason === r ? "active" : ""}`}
                onClick={() => onReasonChange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <label className="au-reject-custom-label">Hoáº·c nháº­p lÃ½ do khÃ¡c:</label>
          <textarea
            className="au-reject-textarea"
            placeholder="Nháº­p lÃ½ do tá»« chá»‘i..."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
          />
        </div>

        <div className="au-modal-footer">
          <button className="au-modal-btn au-modal-btn-reject" onClick={onConfirm}>
            <FaTimesCircle /> XÃ¡c nháº­n tá»« chá»‘i
          </button>
          <button className="au-modal-btn au-modal-btn-cancel" onClick={onCancel}>
            Huá»·
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUploads;


