// components/common/ToastMessage.js
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import "./ToastMessage.css";

const TOAST_ICON = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
};

const ToastMessage = ({
  open,
  type = "info",
  message = "",
  duration = 3200,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open || !message) return null;

  const Icon = TOAST_ICON[type] || TOAST_ICON.info;

  return createPortal(
    <div className={`toast-message toast-${type}`} role="status" aria-live="polite">
      <div className="toast-icon">
        <Icon />
      </div>

      <div className="toast-content">
        <p>{message}</p>
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Dong thong bao"
      >
        <FaTimes />
      </button>
    </div>,
    document.body
  );
};

export default ToastMessage;
