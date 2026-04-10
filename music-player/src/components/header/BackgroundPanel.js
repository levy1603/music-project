// src/components/header/BackgroundPanel.js
import React, { useState, useRef } from "react";
import {
  FaChevronLeft, FaTimes,
  FaUpload, FaCheck, FaRandom,
} from "react-icons/fa";

const SOLID_COLORS = [
  "#0f0f23", "#1a1a2e", "#16213e", "#0d1117",
  "#1e1e2e", "#2d1b69", "#11998e", "#1db954",
  "#e74c3c", "#e67e22", "#8e44ad", "#2980b9",
  "#c0392b", "#27ae60", "#f39c12", "#2c3e50",
];

const GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e, #16213e)",
  "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  "linear-gradient(135deg, #11998e, #38ef7d)",
  "linear-gradient(135deg, #1db954, #191414)",
  "linear-gradient(135deg, #e74c3c, #8e44ad)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #2980b9, #6dd5fa, #ffffff)",
  "linear-gradient(135deg, #f953c6, #b91d73)",
  "linear-gradient(180deg, #1a1a3e 0%, #0f0f23 100%)",
  "linear-gradient(135deg, #232526, #414345)",
  "linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)",
  "linear-gradient(135deg, #005c97, #363795)",
];

const ANIMATED_BG = [
  { label: "Sóng nhạc",     value: "animated-wave"      },
  { label: "Hạt bay",       value: "animated-particles"  },
  { label: "Gradient xoay", value: "animated-gradient"   },
  { label: "Mưa sao",       value: "animated-stars"      },
];

const TABS = [
  { key: "solid",    label: "Màu đơn"  },
  { key: "gradient", label: "Gradient" },
  { key: "animated", label: "Động"     },
  { key: "upload",   label: "Hình ảnh" },
];

const BackgroundPanel = ({
  activeBg,
  getBgKey,
  onApply,
  onReset,
  onBack,
  onClose,
}) => {
  const [bgTab, setBgTab] = useState("solid");
  const fileRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onApply(ev.target.result, "image");
    reader.readAsDataURL(file);
  };

  return (
    <div className="user-dropdown bg-panel">

      {/* ===== HEADER ===== */}
      <div className="bg-panel-header">
        <button className="bg-back-btn" onClick={onBack}>
          <FaChevronLeft />
        </button>
        <span>Thay đổi Background</span>
        <button className="bg-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* ===== TABS ===== */}
      <div className="bg-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`bg-tab ${bgTab === tab.key ? "active" : ""}`}
            onClick={() => setBgTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== NỘI DUNG TAB ===== */}
      <div className="bg-tab-content">

        {/* MÀU ĐƠN */}
        {bgTab === "solid" && (
          <div className="bg-color-grid">
            {SOLID_COLORS.map((color) => (
              <button
                key={color}
                className={`bg-color-swatch ${activeBg === color ? "active" : ""}`}
                style={{ background: color }}
                onClick={() => onApply(color, "color")}
                title={color}
              >
                {activeBg === color && <FaCheck className="swatch-check" />}
              </button>
            ))}
          </div>
        )}

        {/* GRADIENT */}
        {bgTab === "gradient" && (
          <div className="bg-color-grid">
            {GRADIENTS.map((grad) => (
              <button
                key={grad}
                className={`bg-color-swatch ${activeBg === grad ? "active" : ""}`}
                style={{ background: grad }}
                onClick={() => onApply(grad, "color")}
              >
                {activeBg === grad && <FaCheck className="swatch-check" />}
              </button>
            ))}
          </div>
        )}

        {/* ANIMATED */}
        {bgTab === "animated" && (
          <div className="bg-animated-list">
            {ANIMATED_BG.map((item) => (
              <button
                key={item.value}
                className={`bg-animated-item ${activeBg === item.value ? "active" : ""}`}
                onClick={() => onApply(item.value, "animated")}
              >
                <div className={`bg-animated-preview ${item.value}`} />
                <span>{item.label}</span>
                {activeBg === item.value && (
                  <FaCheck className="animated-check" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* UPLOAD */}
        {bgTab === "upload" && (
          <div className="bg-upload-area">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <button
              className="bg-upload-btn"
              onClick={() => fileRef.current?.click()}
            >
              <FaUpload />
              <span>Chọn ảnh từ thiết bị</span>
              <small>JPG, PNG, GIF, WEBP</small>
            </button>

            {activeBg && getBgKey && localStorage.getItem(getBgKey("type")) === "image" && (
              <div className="bg-upload-preview">
                <img src={activeBg} alt="preview" />
                <span>Đang sử dụng</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ===== FOOTER ===== */}
      <div className="bg-panel-footer">
        <button className="bg-reset-btn" onClick={onReset}>
          Đặt lại mặc định
        </button>
      </div>

    </div>
  );
};

export default BackgroundPanel;