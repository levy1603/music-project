// src/components/header/useBackground.js
import { useState, useEffect } from "react";

const getLuminance = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  const toLinear = (c) => {
    c = parseInt(c, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * toLinear(result[1]) +
    0.7152 * toLinear(result[2]) +
    0.0722 * toLinear(result[3])
  );
};

const getGradientLuminance = (gradient) => {
  const hexColors = gradient.match(/#[a-fA-F0-9]{6}/g);
  if (!hexColors || hexColors.length === 0) return 0;
  const avg = hexColors.reduce((sum, hex) => sum + getLuminance(hex), 0);
  return avg / hexColors.length;
};

export const useBackground = (userId) => {
  const [activeBg, setActiveBg] = useState(null);

  const getBgKey = (type) => `bg_${type}_${userId}`;

  const applyBackground = (value, type = "color") => {
    setActiveBg(value);
    document.body.className = "";

    if (type === "animated") {
      document.body.style.background = "";
      document.body.classList.add(value);
      document.documentElement.setAttribute("data-theme", "dark");

    } else if (type === "image") {
      document.body.style.background =
        `url(${value}) center/cover no-repeat fixed`;
      document.documentElement.setAttribute("data-theme", "dark");

    } else {
      document.body.style.background = value;
      const luminance = value.startsWith("#")
        ? getLuminance(value)
        : getGradientLuminance(value);
      document.documentElement.setAttribute(
        "data-theme",
        luminance > 0.4 ? "light" : "dark"
      );
    }

    if (userId) {
      localStorage.setItem(getBgKey("value"), value);
      localStorage.setItem(getBgKey("type"),  type);
    }
  };

  const resetBackground = () => {
    document.body.style.background = "";
    document.body.className = "";
    document.documentElement.setAttribute("data-theme", "dark");
    if (userId) {
      localStorage.removeItem(getBgKey("value"));
      localStorage.removeItem(getBgKey("type"));
    }
    setActiveBg(null);
  };

  // Load khi user thay đổi
  useEffect(() => {
    if (!userId) return;
    const savedValue = localStorage.getItem(getBgKey("value"));
    const savedType  = localStorage.getItem(getBgKey("type"));
    if (savedValue && savedType) {
      applyBackground(savedValue, savedType);
    }
  }, [userId]);

  return {
    activeBg,
    getBgKey,
    applyBackground,
    resetBackground,
  };
};