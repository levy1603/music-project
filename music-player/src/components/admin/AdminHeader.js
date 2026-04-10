// src/components/admin/AdminHeader.js
import React from "react";
import { FaBell, FaUserShield } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./AdminHeader.css";

const TAB_TITLES = {
  stats:     "Dashboard",
  songs:     "Quản lý nhạc",
  users:     "Quản lý tài khoản",
  playlists: "Quản lý Playlist",
  settings:  "Cài đặt",
};

const AdminHeader = ({ activeTab }) => {
  const { user } = useAuth();

  return (
    <header className="admin-header">

      {/* Tiêu đề trang */}
      <div className="admin-header-left">
        <h1 className="admin-header-title">{TAB_TITLES[activeTab]}</h1>
        <p className="admin-header-sub">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Bên phải */}
      <div className="admin-header-right">

        {/* Notification */}
        <button className="admin-header-btn" title="Thông báo">
          <FaBell />
          <span className="admin-notif-dot" />
        </button>

        {/* User */}
        <div className="admin-header-user">
          <img
            src={
              user?.avatar
                ? `http://localhost:5000${user.avatar}`
                : `https://i.pravatar.cc/36?u=${user?._id}`
            }
            alt={user?.username}
            onError={(e) => { e.target.src = `https://i.pravatar.cc/36?u=${user?._id}`; }}
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