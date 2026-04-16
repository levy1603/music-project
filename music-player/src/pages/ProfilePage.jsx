// src/pages/ProfilePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser, FaEdit, FaSave, FaTimes, FaCamera,
  FaArrowLeft, FaMusic, FaHeart, FaInfoCircle,
  FaIdBadge, FaSpinner, FaCheck,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import userAPI from "../api/userAPI";
import getAvatarURL from "../utils/getAvatarURL";
import MySongsList from "../components/MySongsList";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  // ===== STATE =====
  const [isEditing, setIsEditing]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveSuccess, setSaveSuccess]     = useState(false);
  const [error, setError]                 = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [showMySongs, setShowMySongs]     = useState(false); // ✅ THÊM

  const [form, setForm] = useState({
    username : user?.username || "",
    nickname : user?.nickname || "",
    bio      : user?.bio      || "",
  });

  const avatarInputRef = useRef(null);

  // ✅ Refresh data khi vào trang
  useEffect(() => {
    refreshUser();
  }, []);

  // ✅ Sync form khi user thay đổi
  useEffect(() => {
    if (user) {
      setForm({
        username : user.username || "",
        nickname : user.nickname || "",
        bio      : user.bio      || "",
      });
    }
  }, [user]);

  // ✅ Tính count
  const favoriteCount = user?.favoriteCount ?? user?.favorites?.length ?? 0;
  const uploadCount   = user?.uploadCount   ?? 0;

  // ✅ Avatar URL
  const currentAvatar = avatarPreview || getAvatarURL(user?.avatar, 150);

  // ===== XỬ LÝ FORM =====
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ===== CHỌN AVATAR =====
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB!");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ===== LƯU PROFILE =====
  const handleSave = async () => {
    if (!form.username.trim()) {
      setError("Tên người dùng không được để trống!");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let updatedUser = { ...user };

      // Upload avatar nếu có
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarRes  = await userAPI.updateAvatar(formData);
        const avatarPath = avatarRes.data?.data?.avatar
          || avatarRes.data?.avatar;

        if (avatarPath) {
          updatedUser.avatar = avatarPath;
        }
      }

      // Cập nhật profile text
      const profileRes = await userAPI.updateProfile({
        username : form.username.trim(),
        nickname : form.nickname.trim(),
        bio      : form.bio.trim(),
      });

      const profileData = profileRes.data?.data || profileRes.data;
      updatedUser = { ...updatedUser, ...profileData };

      // Cập nhật context + localStorage
      updateUser(updatedUser);

      // Reset state
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi cập nhật thông tin!"
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== HỦY EDIT =====
  const handleCancel = () => {
    setForm({
      username : user?.username || "",
      nickname : user?.nickname || "",
      bio      : user?.bio      || "",
    });
    setAvatarPreview(null);
    setAvatarFile(null);
    setError("");
    setIsEditing(false);
  };

  return (
    <div className="profile-page">

      {/* ===== BACK BUTTON ===== */}
      <button className="profile-back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft />
        <span>Quay lại</span>
      </button>

      <div className="profile-container">

        {/* ===== CỘT TRÁI - AVATAR ===== */}
        <div className="profile-left">

          {/* Avatar */}
          <div className="avatar-wrapper">
            <img
              src={currentAvatar}
              alt="avatar"
              className="profile-avatar"
              onError={(e) => {
                e.target.src = "https://i.pravatar.cc/150";
              }}
            />

            {/* Overlay camera khi edit */}
            {isEditing && (
              <button
                className="avatar-camera-btn"
                onClick={() => avatarInputRef.current?.click()}
                title="Thay đổi ảnh"
              >
                <FaCamera />
                <span>Đổi ảnh</span>
              </button>
            )}

            {/* Input file ẩn */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            {/* Badge online */}
            <div className="avatar-badge" />
          </div>

          {/* Tên + nickname */}
          <h2 className="profile-display-name">{user?.username}</h2>
          {user?.nickname && (
            <p className="profile-nickname">@{user.nickname}</p>
          )}

          {/* Stats */}
          <div className="profile-stats">

            {/* ✅ Bài đã upload - click để xem */}
            <div
              className="profile-stat-card clickable"
              onClick={() => setShowMySongs(true)}
              title="Xem bài đã upload"
            >
              <FaMusic className="profile-stat-icon music" />
              <span className="profile-stat-number">{uploadCount}</span>
              <span className="profile-stat-label">Bài đã upload</span>
            </div>

            {/* Yêu thích */}
            <div className="profile-stat-card">
              <FaHeart className="profile-stat-icon heart" />
              <span className="profile-stat-number">{favoriteCount}</span>
              <span className="profile-stat-label">Yêu thích</span>
            </div>
          </div>

          {/* Nút chỉnh sửa */}
          {!isEditing && (
            <button
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              <FaEdit /> Chỉnh sửa hồ sơ
            </button>
          )}
        </div>

        {/* ===== CỘT PHẢI - THÔNG TIN ===== */}
        <div className="profile-right">

          {/* Header */}
          <div className="profile-right-header">
            <h3>
              {isEditing ? "✏️ Chỉnh sửa hồ sơ" : "👤 Thông tin cá nhân"}
            </h3>
            {saveSuccess && (
              <div className="save-success-badge">
                <FaCheck /> Đã lưu!
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="profile-error">
              <FaTimes /> {error}
            </div>
          )}

          {/* ===== FORM ===== */}
          <div className="profile-form">

            {/* Username */}
            <div className="form-group">
              <label>
                <FaUser className="label-icon" />
                Tên người dùng
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="profile-input"
                  placeholder="Nhập tên người dùng..."
                  maxLength={30}
                />
              ) : (
                <div className="profile-value">
                  {user?.username || (
                    <span className="empty-value">Chưa cập nhật</span>
                  )}
                </div>
              )}
            </div>

            {/* Nickname */}
            <div className="form-group">
              <label>
                <FaIdBadge className="label-icon" />
                Biệt danh
              </label>
              {isEditing ? (
                <div className="input-with-prefix">
                  <span className="input-prefix">@</span>
                  <input
                    type="text"
                    name="nickname"
                    value={form.nickname}
                    onChange={handleChange}
                    className="profile-input has-prefix"
                    placeholder="Nhập biệt danh..."
                    maxLength={30}
                  />
                </div>
              ) : (
                <div className="profile-value">
                  {user?.nickname
                    ? `@${user.nickname}`
                    : <span className="empty-value">Chưa cập nhật</span>
                  }
                </div>
              )}
            </div>

            {/* Email - chỉ đọc */}
            <div className="form-group">
              <label>
                <FaInfoCircle className="label-icon" />
                Email
              </label>
              <div className="profile-value readonly">
                {user?.email}
                <span className="readonly-badge">Không thể thay đổi</span>
              </div>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label>
                <FaInfoCircle className="label-icon" />
                Mô tả bản thân
              </label>
              {isEditing ? (
                <>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    className="profile-textarea"
                    placeholder="Viết gì đó về bản thân bạn..."
                    rows={4}
                    maxLength={200}
                  />
                  <span className="char-count">
                    {form.bio.length}/200
                  </span>
                </>
              ) : (
                <div className="profile-value bio">
                  {user?.bio || (
                    <span className="empty-value">
                      Chưa có mô tả. Hãy cho mọi người biết về bạn!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Ngày tham gia */}
            <div className="form-group">
              <label>
                <FaInfoCircle className="label-icon" />
                Ngày tham gia
              </label>
              <div className="profile-value readonly">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                      day   : "2-digit",
                      month : "2-digit",
                      year  : "numeric",
                    })
                  : "Không rõ"
                }
              </div>
            </div>
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          {isEditing && (
            <div className="profile-actions">
              <button
                className="cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                <FaTimes /> Hủy
              </button>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <><FaSpinner className="spinning" /> Đang lưu...</>
                ) : (
                  <><FaSave /> Lưu thay đổi</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== MY SONGS LIST ===== */}
      {showMySongs && (
        <MySongsList onClose={() => setShowMySongs(false)} />
      )}
    </div>
  );
};

export default ProfilePage;