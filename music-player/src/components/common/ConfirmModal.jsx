// components/common/ConfirmModal.js
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";
import "./ConfirmModal.css";

const ConfirmModal = ({
  open,
  title = "Xac nhan",
  message = "Ban co chac chan muon thuc hien thao tac nay?",
  confirmText = "Xac nhan",
  cancelText = "Huy",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return undefined;

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

  const handleOverlayClick = () => {
    if (loading) return;
    onClose?.();
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm?.();
  };

  const modalContent = (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="confirm-modal-box"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <div className="confirm-modal-title-wrap">
            <div className="confirm-modal-icon">
              <FaExclamationTriangle />
            </div>
            <div>
              <h3>{title}</h3>
            </div>
          </div>

          <button
            type="button"
            className="confirm-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Dong"
          >
            <FaTimes />
          </button>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="confirm-btn cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-btn ${confirmVariant}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Dang xu ly..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;
