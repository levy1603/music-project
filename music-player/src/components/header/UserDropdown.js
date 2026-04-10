// src/components/header/UserDropdown.js
import React from "react";
import {
  FaUser,
  FaHeart,
  FaImage,
  FaSignOutAlt,
  FaCloudUploadAlt,
} from "react-icons/fa";
import getAvatarURL from "../../utils/getAvatarURL";

const UserDropdown = ({ user, onNavigate, onShowBgPanel, onLogout }) => {
  const avatarURL = getAvatarURL(user?.avatar, 44);

  return (
    <div className="user-dropdown">

      {/* ===== HEADER ===== */}
      <div className="dropdown-header">
        <img
          src={avatarURL}
          alt="avatar"
          className="dropdown-avatar"
          onError={(e) => { e.target.src = "https://i.pravatar.cc/44"; }}
        />
        <div className="dropdown-user-info">
          <span className="dropdown-username">{user?.username}</span>
          <span className="dropdown-email">{user?.email}</span>
        </div>
      </div>

      <div className="dropdown-divider" />

      {/* ===== TRANG CÁ NHÂN ===== */}
      <button
        className="dropdown-item"
        onClick={() => onNavigate("/profile")}
      >
        <div className="dropdown-item-icon profile"><FaUser /></div>
        <div className="dropdown-item-text">
          <span>Trang cá nhân</span>
          <small>Xem thông tin của bạn</small>
        </div>
      </button>

      {/* ===== YÊU THÍCH ===== */}
      <button
        className="dropdown-item"
        onClick={() => onNavigate("/favorites")}
      >
        <div className="dropdown-item-icon favorites"><FaHeart /></div>
        <div className="dropdown-item-text">
          <span>Nhạc yêu thích</span>
          <small>Danh sách bài hát đã thích</small>
        </div>
      </button>

      {/* ===== UPLOAD NHẠC ===== */}
      <button
        className="dropdown-item"
        onClick={() => onNavigate("/upload")}
      >
        <div className="dropdown-item-icon upload"><FaCloudUploadAlt /></div>
        <div className="dropdown-item-text">
          <span>Upload nhạc</span>
          <small>Đăng tải bài hát của bạn</small>
        </div>
      </button>

      {/* ===== BACKGROUND ===== */}
      <button
        className="dropdown-item"
        onClick={onShowBgPanel}
      >
        <div className="dropdown-item-icon background"><FaImage /></div>
        <div className="dropdown-item-text">
          <span>Thay đổi Background</span>
          <small>Tùy chỉnh giao diện</small>
        </div>
      </button>

      <div className="dropdown-divider" />

      {/* ===== ĐĂNG XUẤT ===== */}
      <button className="dropdown-item logout" onClick={onLogout}>
        <div className="dropdown-item-icon logout-icon"><FaSignOutAlt /></div>
        <div className="dropdown-item-text">
          <span>Đăng xuất</span>
          <small>Thoát khỏi tài khoản</small>
        </div>
      </button>

    </div>
  );
};

export default UserDropdown;