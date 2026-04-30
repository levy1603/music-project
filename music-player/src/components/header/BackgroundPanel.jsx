// components/header/BackgroundPanel.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  FaChevronLeft,
  FaTimes,
  FaUpload,
  FaCheck,
  FaRandom,
  FaImage,
} from "react-icons/fa";

const SOLID_COLORS = [
  "#0f172a",
  "#111827",
  "#1e1b4b",
  "#0b1020",
  "#1f2937",
  "#1e293b",
  "#0f766e",
  "#7c3aed",
  "#db2777",
  "#0ea5e9",
  "#f97316",
  "#334155",
  "#4c1d95",
  "#164e63",
  "#1d4ed8",
  "#3f3f46",
];

const GRADIENTS = [
  "linear-gradient(135deg, #0f172a, #1e293b)",
  "linear-gradient(135deg, #1e1b4b, #312e81, #0f172a)",
  "linear-gradient(135deg, #0f766e, #06b6d4)",
  "linear-gradient(135deg, #7c3aed, #06b6d4)",
  "linear-gradient(135deg, #db2777, #7c3aed)",
  "linear-gradient(135deg, #f97316, #f59e0b)",
  "linear-gradient(135deg, #1d4ed8, #38bdf8)",
  "linear-gradient(135deg, #4c1d95, #c084fc)",
  "linear-gradient(180deg, #111827 0%, #0b1020 100%)",
  "linear-gradient(135deg, #1f2937, #111827)",
  "linear-gradient(135deg, #164e63, #0ea5e9, #67e8f9)",
  "linear-gradient(135deg, #312e81, #7c3aed, #06b6d4)",
];

const ANIMATED_BG = [
  { label: "Sóng màu", value: "animated-wave" },
  { label: "Hạt sáng", value: "animated-particles" },
  { label: "Gradient động", value: "animated-gradient" },
  { label: "Bầu trời sao", value: "animated-stars" },
];

const TABS = [
  { key: "solid", label: "Màu đơn" },
  { key: "gradient", label: "Gradient" },
  { key: "animated", label: "Hiệu ứng" },
  { key: "upload", label: "Ảnh nền" },
];

const getTypeFromValue = (value, explicitType) => {
  if (explicitType) return explicitType;
  if (!value) return "color";
  if (typeof value === "string" && value.startsWith("data:image")) return "image";
  if (
    value === "animated-wave" ||
    value === "animated-particles" ||
    value === "animated-gradient" ||
    value === "animated-stars"
  ) {
    return "animated";
  }
  return "color";
};

const getInitialTabFromType = (type) => {
  if (type === "image") return "upload";
  if (type === "animated") return "animated";
  return "solid";
};

const BackgroundPanel = ({
  activeBg,
  getBgKey,
  onApply,
  onReset,
  onBack,
  onClose,
}) => {
  const fileRef = useRef(null);

  const storedType = useMemo(() => {
    return getBgKey ? localStorage.getItem(getBgKey("type")) : "color";
  }, [getBgKey]);

  const [bgTab, setBgTab] = useState(getInitialTabFromType(storedType || "color"));
  const [selectedBg, setSelectedBg] = useState(activeBg || null);
  const [selectedType, setSelectedType] = useState(
    getTypeFromValue(activeBg, storedType || "color")
  );

  useEffect(() => {
    setSelectedBg(activeBg || null);
    setSelectedType(getTypeFromValue(activeBg, storedType || "color"));
  }, [activeBg, storedType]);

  const previewStyle = useMemo(() => {
    if (!selectedBg) {
      return {
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
      };
    }

    if (selectedType === "image") {
      return {
        backgroundImage: `url(${selectedBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    if (selectedType === "animated") {
      if (selectedBg === "animated-wave") {
        return {
          background: "linear-gradient(135deg, #0f172a, #6366f1, #06b6d4)",
          backgroundSize: "200% 200%",
        };
      }
      if (selectedBg === "animated-particles") {
        return {
          background: "radial-gradient(circle at 30% 40%, #312e81, #0b1020)",
        };
      }
      if (selectedBg === "animated-gradient") {
        return {
          background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)",
          backgroundSize: "200% 200%",
        };
      }
      return {
        background: "#0b1020",
      };
    }

    return {
      background: selectedBg,
    };
  }, [selectedBg, selectedType]);

  const selectBackground = useCallback((value, type) => {
    setSelectedBg(value);
    setSelectedType(type);
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      setSelectedBg(result);
      setSelectedType("image");
      setBgTab("upload");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleApplySelected = useCallback(() => {
    if (!selectedBg || !selectedType) return;
    onApply(selectedBg, selectedType);
  }, [selectedBg, selectedType, onApply]);

  const handleResetAll = useCallback(() => {
    setSelectedBg(null);
    setSelectedType("color");
    onReset();
  }, [onReset]);

  const handleRandom = useCallback(() => {
    const merged = [
      ...SOLID_COLORS.map((item) => ({ value: item, type: "color" })),
      ...GRADIENTS.map((item) => ({ value: item, type: "color" })),
      ...ANIMATED_BG.map((item) => ({ value: item.value, type: "animated" })),
    ];

    const randomItem = merged[Math.floor(Math.random() * merged.length)];
    setSelectedBg(randomItem.value);
    setSelectedType(randomItem.type);

    if (randomItem.type === "animated") setBgTab("animated");
    else if (GRADIENTS.includes(randomItem.value)) setBgTab("gradient");
    else setBgTab("solid");
  }, []);

  const isChanged = selectedBg !== activeBg || selectedType !== storedType;

  return (
    <div className="user-dropdown bg-panel">
      <div className="bg-panel-header">
        <button type="button" className="bg-back-btn" onClick={onBack}>
          <FaChevronLeft />
        </button>

        <span>Thay đổi Background</span>

        <button type="button" className="bg-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* PREVIEW */}
      <div className="bg-preview-section">
        <div className="bg-preview-card" style={previewStyle}>
          {selectedType === "animated" && (
            <div className={`bg-preview-animated-overlay ${selectedBg}`} />
          )}

          <div className="bg-preview-overlay" />
          <div className="bg-preview-content">
            <span className="bg-preview-label">Xem trước</span>
            <strong>Nền giao diện của bạn</strong>
            <small>
              {selectedType === "image"
                ? "Ảnh nền cá nhân"
                : selectedType === "animated"
                ? "Hiệu ứng nền động"
                : "Màu / gradient tùy chọn"}
            </small>
          </div>
        </div>

        <div className="bg-preview-actions">
          <button type="button" className="bg-random-btn" onClick={handleRandom}>
            <FaRandom /> Ngẫu nhiên
          </button>

          <button
            type="button"
            className="bg-apply-btn"
            onClick={handleApplySelected}
            disabled={!selectedBg || !isChanged}
          >
            <FaCheck /> Áp dụng
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bg-tab ${bgTab === tab.key ? "active" : ""}`}
            onClick={() => setBgTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-tab-content">
        {bgTab === "solid" && (
          <div className="bg-color-grid">
            {SOLID_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`bg-color-swatch ${
                  selectedBg === color && selectedType === "color" ? "active" : ""
                }`}
                style={{ background: color }}
                onClick={() => selectBackground(color, "color")}
                title={color}
              >
                {selectedBg === color && selectedType === "color" && (
                  <FaCheck className="swatch-check" />
                )}
              </button>
            ))}
          </div>
        )}

        {bgTab === "gradient" && (
          <div className="bg-color-grid">
            {GRADIENTS.map((gradient) => (
              <button
                key={gradient}
                type="button"
                className={`bg-color-swatch ${
                  selectedBg === gradient && selectedType === "color" ? "active" : ""
                }`}
                style={{ background: gradient }}
                onClick={() => selectBackground(gradient, "color")}
                title="Gradient"
              >
                {selectedBg === gradient && selectedType === "color" && (
                  <FaCheck className="swatch-check" />
                )}
              </button>
            ))}
          </div>
        )}

        {bgTab === "animated" && (
          <div className="bg-animated-list">
            {ANIMATED_BG.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`bg-animated-item ${
                  selectedBg === item.value && selectedType === "animated"
                    ? "active"
                    : ""
                }`}
                onClick={() => selectBackground(item.value, "animated")}
              >
                <div className={`bg-animated-preview ${item.value}`} />
                <span>{item.label}</span>
                {selectedBg === item.value && selectedType === "animated" && (
                  <FaCheck className="animated-check" />
                )}
              </button>
            ))}
          </div>
        )}

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
              type="button"
              className="bg-upload-btn"
              onClick={() => fileRef.current?.click()}
            >
              <FaUpload />
              <span>Chọn ảnh từ thiết bị</span>
              <small>Ảnh sẽ phủ toàn bộ nền giao diện</small>
            </button>

            {selectedBg && selectedType === "image" ? (
              <div className="bg-upload-preview large">
                <img src={selectedBg} alt="preview" />
                <span>Ảnh nền đã chọn</span>
              </div>
            ) : (
              <div className="bg-upload-empty">
                <FaImage />
                <p>Chưa chọn ảnh nền</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-panel-footer">
        <button type="button" className="bg-reset-btn" onClick={handleResetAll}>
          Đặt lại mặc định
        </button>
      </div>
    </div>
  );
};

export default BackgroundPanel;