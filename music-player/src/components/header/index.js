// src/components/header/index.js
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMusic, FaUser, FaChevronDown } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useBackground } from "./useBackground";
import UserDropdown from "./UserDropdown";
import BackgroundPanel from "./BackgroundPanel";
import SearchBar from "../SearchBar";
import NotificationBell from "./NotificationBell"; // 👈 THÊM
import "../Header.css";
import getAvatarURL from "../../utils/getAvatarURL";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu,    setShowMenu]    = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const menuRef   = useRef(null);
  const avatarURL = getAvatarURL(user?.avatar, 40);

  const { activeBg, getBgKey, applyBackground, resetBackground } =
    useBackground(user?._id);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowBgPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    resetBackground();
    setShowMenu(false);
    setShowBgPanel(false);
    logout();
  };

  const handleNavigate = (path) => {
    setShowMenu(false);
    setShowBgPanel(false);
    navigate(path);
  };

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <FaMusic className="logo-icon" />
        <h1>MusicVN</h1>
      </Link>

      <SearchBar />

      <div className="header-user">
        {isAuthenticated ? (
          <>
            {/* 🔔 NOTIFICATION BELL - hiện khi đã đăng nhập */}
            <NotificationBell />

            <div className="user-menu-wrapper" ref={menuRef}>
              <button
                className={`user-trigger ${showMenu ? "active" : ""}`}
                onClick={() => { setShowMenu(!showMenu); setShowBgPanel(false); }}
              >
                <img
                  src={avatarURL}
                  alt="avatar"
                  className="user-avatar"
                  onError={(e) => { e.target.src = "https://i.pravatar.cc/40"; }}
                />
                <span className="user-name">{user?.username}</span>
                <FaChevronDown className={`chevron ${showMenu ? "rotated" : ""}`} />
              </button>

              {showMenu && !showBgPanel && (
                <UserDropdown
                  user={user}
                  onNavigate={handleNavigate}
                  onShowBgPanel={() => setShowBgPanel(true)}
                  onLogout={handleLogout}
                />
              )}

              {showMenu && showBgPanel && (
                <BackgroundPanel
                  activeBg={activeBg}
                  getBgKey={getBgKey}
                  onApply={applyBackground}
                  onReset={resetBackground}
                  onBack={() => setShowBgPanel(false)}
                  onClose={() => { setShowMenu(false); setShowBgPanel(false); }}
                />
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="login-link">
            <FaUser /> Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;