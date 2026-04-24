import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaKeyboard, FaTimes } from "react-icons/fa";
import "./PasteLyricsModal.css";

const PasteLyricsModal = ({
  open,
  title = "Paste lời bài hát",
  placeholder = "Mỗi dòng là một câu lời bài hát...",
  confirmText = "Nhập lời",
  cancelText = "Hủy",
  loading = false,
  initialValue = "",
  onConfirm,
  onClose,
}) => {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    setText(initialValue || "");
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    if (loading) return;
    onConfirm?.(text);
  };

  const lineCount = text
    .split("\n")
    .filter((line) => line.trim())
    .length;

  const modalContent = (
    <div className="paste-modal-overlay" onClick={!loading ? onClose : undefined}>
      <div
        className="paste-modal-box"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="paste-modal-header">
          <div className="paste-modal-title-wrap">
            <div className="paste-modal-icon">
              <FaKeyboard />
            </div>
            <div>
              <h3>{title}</h3>
              <p>Dán lời bài hát, mỗi dòng tương ứng một câu.</p>
            </div>
          </div>

          <button
            type="button"
            className="paste-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <FaTimes />
          </button>
        </div>

        <div className="paste-modal-body">
          <textarea
            className="paste-modal-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholder}
            rows={12}
            disabled={loading}
          />

          <div className="paste-modal-meta">
            <span>{lineCount} dòng hợp lệ</span>
          </div>
        </div>

        <div className="paste-modal-footer">
          <button
            type="button"
            className="paste-btn cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="paste-btn primary"
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PasteLyricsModal;