// src/context/NotificationContext.js
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from "react";
import { useAuth }         from "./AuthContext";
import notificationAPI     from "../api/notificationAPI";

const NotificationContext = createContext();
const POLL_INTERVAL       = 30_000;

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth(); // 👈 thêm user

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const timerRef = useRef(null);

  /* ══════════════════════════════════════
     👈 Reset ngay khi user thay đổi
     (đăng xuất / đổi tài khoản)
  ══════════════════════════════════════ */
  useEffect(() => {
    // Clear data cũ ngay lập tức khi user thay đổi
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  }, [user?._id]); // 👈 Theo dõi user._id, không phải isAuthenticated

  /* ══════════════════════════════════════
     Fetch thông báo
  ══════════════════════════════════════ */
  const fetchNotifications = useCallback(async () => {
    // ✅ Double check: phải có auth VÀ có user
    if (!isAuthenticated || !user?._id) return;

    setLoading(true);
    try {
      const result = await notificationAPI.getAll({ limit: 20 });

      // ✅ Verify data trả về đúng user hiện tại
      console.log("📬 Fetch for user:", user.username, "| Got:", result?.notifications?.length);

      setNotifications(result?.notifications || []);
      setUnreadCount(result?.unreadCount     || 0);
    } catch (err) {
      console.error("❌ Fetch notifications error:", err);
      // Nếu lỗi 401 → clear data
      if (err?.status === 401 || err?.statusCode === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id]); // 👈 Depend vào user._id

  /* ══════════════════════════════════════
     Polling - reset khi user thay đổi
  ══════════════════════════════════════ */
  useEffect(() => {
    // Dừng polling cũ
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isAuthenticated || !user?._id) {
      // Đăng xuất → clear tất cả
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Đăng nhập → fetch ngay + bắt đầu polling
    fetchNotifications();
    timerRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, user?._id]); // 👈 Quan trọng: depend vào user._id

  /* ══════════════════════════════════════
     Actions
  ══════════════════════════════════════ */
  const markAsRead = useCallback(async (id) => {
    if (!isAuthenticated) return;
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("❌ markAsRead error:", err);
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("❌ markAllAsRead error:", err);
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(async (id) => {
    if (!isAuthenticated) return;
    try {
      const target = notifications.find((n) => n._id === id);
      await notificationAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("❌ deleteNotification error:", err);
    }
  }, [isAuthenticated, notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications phải dùng trong NotificationProvider");
  }
  return context;
};