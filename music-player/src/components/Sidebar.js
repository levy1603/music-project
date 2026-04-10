// src/components/Sidebar.js
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaHeart,
  FaListUl,
  FaCompactDisc,
  FaChevronLeft,
  FaChevronRight,
  FaMusic,
  FaUserShield, // ✅ Icon Admin
  FaLayerGroup, // ✅ Icon Các Playlist
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { isAuthenticated, user } = useAuth(); // ✅ Thêm user

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "64px" : "240px"
    );
  }, []);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebarCollapsed", next);
    document.documentElement.style.setProperty(
      "--sidebar-width",
      next ? "64px" : "240px"
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* ===== NÚT TOGGLE ===== */}
      <button
        className="sidebar-toggle-btn"
        onClick={handleToggle}
        title={collapsed ? "Mở rộng" : "Thu gọn"}
      >
        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {/* ===== SCROLL ===== */}
      <div className="sidebar-scroll">

        {/* ===== MENU CHÍNH ===== */}
        <nav className="sidebar-nav">
          {!collapsed && <h3 className="sidebar-title">MENU</h3>}

          <NavLink to="/" className="sidebar-link" title="Trang chủ" end>
            <FaHome />
            {!collapsed && <span>Trang chủ</span>}
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/favorites" className="sidebar-link" title="Yêu thích">
                <FaHeart />
                {!collapsed && <span>Yêu thích</span>}
              </NavLink>

              <NavLink to="/playlist" className="sidebar-link" title="Nhạc đã nghe">
                <FaListUl />
                {!collapsed && <span>Nhạc đã nghe</span>}
              </NavLink>

              <NavLink to="/my-playlists" className="sidebar-link" title="Các Playlist">
                <FaLayerGroup />
                {!collapsed && <span>Các Playlist</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* ===== KHÁM PHÁ ===== */}
        <div className="sidebar-playlists">
          {!collapsed && <h3 className="sidebar-title">KHÁM PHÁ</h3>}

          <div className="playlist-item" title="Nhạc Việt Hot">
            <FaCompactDisc />
            {!collapsed && <span>Nhạc Việt Hot</span>}
          </div>
          <div className="playlist-item" title="Chill & Relax">
            <FaCompactDisc />
            {!collapsed && <span>Chill & Relax</span>}
          </div>
          <div className="playlist-item" title="Workout Mix">
            <FaCompactDisc />
            {!collapsed && <span>Workout Mix</span>}
          </div>
        </div>

        {/* ===== ADMIN ===== */}
        {isAuthenticated && user?.role === "admin" && (
          <div className="sidebar-admin">
            {!collapsed && <h3 className="sidebar-title">QUẢN TRỊ</h3>}
            <NavLink to="/admin" className="sidebar-link sidebar-link-admin" title="Trang quản trị">
              <FaUserShield />
              {!collapsed && <span>Quản trị</span>}
            </NavLink>
          </div>
        )}

      </div>
    </aside>
  );
};

export default Sidebar;