// src/components/admin/AdminHeader.js
import React from "react";
import { FaUserShield } from "react-icons/fa";
import { useAuth }                from "../../context/AuthContext";
import AdminNotificationBell      from "./AdminNotificationBell";
import "./AdminHeader.css";

const TAB_TITLES = {
  stats:     "Dashboard",
  songs:     "Quản lý nhạc",
  users:     "Quản lý tài khoản",
  playlists: "Quản lý Playlist",
  uploads:   "Quản lý Upload",  
  settings:  "Cài đặt",
};

const AdminHeader = ({ activeTab, onNavigateToSong }) => {
  const { user } = useAuth();

  return (
    <header className="admin-header">

      {/* ── Tiêu đề trang ── */}
      <div className="admin-header-left">
        <h1 className="admin-header-title">
          {TAB_TITLES[activeTab] || "Admin"}
        </h1>
        <p className="admin-header-sub">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year:    "numeric",
            month:   "long",
            day:     "numeric",
          })}
        </p>
      </div>

      {/* ── Bên phải ── */}
      <div className="admin-header-right">

        {/*  Notification Bell */}
        <AdminNotificationBell
          onNavigateToSong={onNavigateToSong}
        />

        {/* User info */}
        <div className="admin-header-user">
          <img
            src={
              user?.avatar
                ? `http://localhost:5000${user.avatar}`
                : `https://i.pravatar.cc/36?u=${user?._id}`
            }
            alt={user?.username}
            onError={(e) => {
              e.target.src = `https://i.pravatar.cc/36?u=${user?._id}`;
            }}
          />
          <div className="admin-header-user-info">
            <span className="admin-header-username">{user?.username}</span>
            <span className="admin-header-role">
              <FaUserShield /> Administrator
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};

export default AdminHeader;