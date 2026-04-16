// src/components/header/NotificationBell.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  FaBell, FaCheck, FaMusic, FaSpinner,
  FaUser, FaCheckCircle, FaTimesCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import "./NotificationBell.css";

/* ══════════════════════════════════════════
   Config theo type
══════════════════════════════════════════ */
const TYPE_CONFIG = {
  song_approved: {
    emoji: "✅",
    icon:  <FaCheckCircle />,
    color: "#34d399",
    bg:    "rgba(52,211,153,0.12)",
    label: "Đã duyệt",
  },
  song_rejected: {
    emoji: "❌",
    icon:  <FaTimesCircle />,
    color: "#f87171",
    bg:    "rgba(248,113,113,0.12)",
    label: "Từ chối",
  },
  system: {
    emoji: "🔔",
    icon:  <FaBell />,
    color: "#818cf8",
    bg:    "rgba(129,140,248,0.12)",
    label: "Hệ thống",
  },
  new_upload: {
    emoji: "🎵",
    icon:  <FaMusic />,
    color: "#fbbf24",
    bg:    "rgba(251,191,36,0.12)",
    label: "Upload",
  },
};

/* ══════════════════════════════════════════
   Avatar theo type
══════════════════════════════════════════ */
const NotificationAvatar = ({ noti }) => {
  const cfg = TYPE_CONFIG[noti.type] || TYPE_CONFIG.system;

  if (noti.type === "song_approved" || noti.type === "song_rejected") {
    const coverURL = noti.data?.coverImage
      ? `http://localhost:5000/uploads/covers/${noti.data.coverImage}`
      : null;

    return (
      <div className="noti-avatar">
        {coverURL ? (
          <img
            src={coverURL}
            alt="cover"
            className="noti-avatar-img"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div
            className="noti-avatar-icon"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <FaMusic />
          </div>
        )}
        <span className="noti-type-badge">{cfg.emoji}</span>
      </div>
    );
  }

  return (
    <div className="noti-avatar">
      <div
        className="noti-avatar-icon"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.icon}
      </div>
      <span className="noti-type-badge">{cfg.emoji}</span>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef         = useRef(null);
  const navigate            = useNavigate();

  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead,
    deleteNotification, fetchNotifications,
  } = useNotifications();

  /* ── Click outside ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  const handleClickItem = async (noti) => {
    if (!noti.isRead) await markAsRead(noti._id);
    setIsOpen(false);
    if (noti.data?.songId) navigate(`/song/${noti.data.songId}`);
  };

  /* ── Navigate đến trang notifications ── */
  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  const formatTime = (dateStr) => {
    const diff  = Date.now() - new Date(dateStr);
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return "Vừa xong";
    if (mins  < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>

      {/* ── Bell button ── */}
      <button
        className={`notification-bell ${isOpen ? "active" : ""}`}
        onClick={handleToggle}
        aria-label="Thông báo"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="notification-dropdown">

          {/* ════ Header ════ */}
          <div className="notification-header">
            <span className="notification-title">
              Thông báo
              {unreadCount > 0 && (
                <span className="header-unread-count">{unreadCount} mới</span>
              )}
            </span>
            {unreadCount > 0 && (
              <button className="notification-mark-all" onClick={markAllAsRead}>
                <FaCheck /> Đọc tất cả
              </button>
            )}
          </div>

          {/* ════ List ════ */}
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <FaSpinner className="spin" /> Đang tải...
              </div>

            ) : notifications.length === 0 ? (
              /* ── Empty state ── */
              <div className="notification-empty">
                <FaBell className="notification-empty-icon" />
                <p className="notification-empty-text">Không có thông báo nào</p>
                <p className="notification-empty-sub">
                  Bạn sẽ nhận thông báo khi có cập nhật mới
                </p>
              </div>

            ) : (
              notifications.map((noti) => {
                const cfg = TYPE_CONFIG[noti.type] || TYPE_CONFIG.system;
                return (
                  <div
                    key={noti._id}
                    className={`notification-item ${!noti.isRead ? "unread" : ""}`}
                    style={{
                      borderLeft: !noti.isRead
                        ? `3px solid ${cfg.color}`
                        : "3px solid transparent",
                    }}
                    onClick={() => handleClickItem(noti)}
                  >
                    <NotificationAvatar noti={noti} />

                    {/* Content */}
                    <div className="noti-content">
                      <div className="noti-content-top">
                        <span
                          className="noti-type-label"
                          style={{ color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        <span className="noti-time">
                          {formatTime(noti.createdAt)}
                        </span>
                      </div>
                      <p className="noti-title">{noti.title}</p>
                      <p className="noti-message">{noti.message}</p>

                      {/* Lý do từ chối */}
                      {noti.type === "song_rejected" && noti.data?.rejectReason && (
                        <p className="noti-reject-reason">
                          ⚠️ {noti.data.rejectReason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="noti-actions">
                      {!noti.isRead && (
                        <span
                          className="unread-dot"
                          style={{ background: cfg.color }}
                        />
                      )}
                      <button
                        className="noti-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(noti._id);
                        }}
                        title="Xóa"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ════ Footer - LUÔN hiện ════ */}
          <div className="notification-footer">
            <button
              className="notification-view-all"
              onClick={handleViewAll}
            >
              <FaBell />
              Xem tất cả thông báo
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;