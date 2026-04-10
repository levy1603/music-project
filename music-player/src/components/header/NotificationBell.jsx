// src/components/header/NotificationBell.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "like",
    message: "Nguyễn Văn A đã thích bài hát của bạn",
    time: "2 phút trước",
    isRead: false,
    avatar: "https://i.pravatar.cc/32?img=1",
    link: "/songs/123",
  },
  {
    id: 2,
    type: "follow",
    message: "Trần Thị B đã theo dõi bạn",
    time: "10 phút trước",
    isRead: false,
    avatar: "https://i.pravatar.cc/32?img=2",
    link: "/profile/b",
  },
  {
    id: 3,
    type: "comment",
    message: "Lê Văn C đã bình luận về playlist của bạn",
    time: "1 giờ trước",
    isRead: true,
    avatar: "https://i.pravatar.cc/32?img=3",
    link: "/playlist/456",
  },
  {
    id: 4,
    type: "system",
    message: "Chào mừng bạn đến với MusicVN! 🎵",
    time: "1 ngày trước",
    isRead: true,
    avatar: null,
    link: "/",
  },
];

const TYPE_ICON = {
  like:    "❤️",
  follow:  "👤",
  comment: "💬",
  system:  "🔔",
};

const NotificationBell = () => {
  const [isOpen, setIsOpen]               = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef                       = useRef(null);
  const navigate                          = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ===== CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClickItem = (notification) => {
    // Đánh dấu đã đọc
    setNotifications((prev) =>
      prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    setIsOpen(false);
    navigate(notification.link);
  };

  const handleDeleteItem = (e, id) => {
    e.stopPropagation(); // Không trigger handleClickItem
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>

      {/* ===== BELL BUTTON ===== */}
      <button
        className={`notification-bell ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ===== DROPDOWN ===== */}
      {isOpen && (
        <div className="notification-dropdown">

          {/* Header dropdown */}
          <div className="notification-header">
            <span className="notification-title">Thông báo</span>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all"
                onClick={handleMarkAllRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Danh sách */}
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <FaBell className="empty-icon" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((noti) => (
                <div
                  key={noti.id}
                  className={`notification-item ${!noti.isRead ? "unread" : ""}`}
                  onClick={() => handleClickItem(noti)}
                >
                  {/* Avatar hoặc icon */}
                  <div className="noti-avatar">
                    {noti.avatar ? (
                      <img src={noti.avatar} alt="avatar" />
                    ) : (
                      <div className="noti-avatar-placeholder">🎵</div>
                    )}
                    <span className="noti-type-icon">
                      {TYPE_ICON[noti.type]}
                    </span>
                  </div>

                  {/* Nội dung */}
                  <div className="noti-content">
                    <p className="noti-message">{noti.message}</p>
                    <span className="noti-time">{noti.time}</span>
                  </div>

                  {/* Dot chưa đọc + nút xóa */}
                  <div className="noti-actions">
                    {!noti.isRead && <span className="unread-dot" />}
                    <button
                      className="noti-delete"
                      onClick={(e) => handleDeleteItem(e, noti.id)}
                      aria-label="Xóa thông báo"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button onClick={() => { setIsOpen(false); navigate("/notifications"); }}>
                Xem tất cả thông báo
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default NotificationBell;