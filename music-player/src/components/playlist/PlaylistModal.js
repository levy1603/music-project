// src/components/playlist/PlaylistModal.js
import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./PlaylistModal.css";

const PlaylistModal = ({ playlist, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });
  const [errors, setErrors] = useState({});

  // Nếu là sửa → điền sẵn dữ liệu
  useEffect(() => {
    if (playlist) {
      setFormData({
        name: playlist.name || "",
        description: playlist.description || "",
        isPublic: playlist.isPublic ?? true,
      });
    }
  }, [playlist]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Vui lòng nhập tên playlist";
    if (formData.name.length > 50) newErrors.name = "Tên tối đa 50 ký tự";
    if (formData.description.length > 200) newErrors.description = "Mô tả tối đa 200 ký tự";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h3>{playlist ? "Chỉnh sửa Playlist" : "Tạo Playlist mới"}</h3>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">

          {/* Tên */}
          <div className="form-group">
            <label>Tên Playlist <span className="required">*</span></label>
            <input
              type="text"
              placeholder="Nhập tên playlist..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={50}
            />
            {errors.name && <span className="error">{errors.name}</span>}
            <span className="char-count">{formData.name.length}/50</span>
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              placeholder="Nhập mô tả (tuỳ chọn)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
              rows={3}
            />
            {errors.description && <span className="error">{errors.description}</span>}
            <span className="char-count">{formData.description.length}/200</span>
          </div>

          {/* Public / Private toggle */}
          <div className="form-group form-toggle">
            <label>Chế độ</label>
            <div className="toggle-switch">
              <span className={!formData.isPublic ? "active" : ""}>🔒 Riêng tư</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <span className="slider" />
              </label>
              <span className={formData.isPublic ? "active" : ""}>🌐 Công khai</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-save">
              {playlist ? "Lưu thay đổi" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaylistModal;