// components/Header/useBackground.js
import { useState, useEffect, useCallback } from "react";

const getLuminance = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;

  const toLinear = (channel) => {
    const c = parseInt(channel, 16) / 255;
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

  const total = hexColors.reduce((sum, hex) => sum + getLuminance(hex), 0);
  return total / hexColors.length;
};

export const useBackground = (userId) => {
  const [activeBg, setActiveBg] = useState(null);

  const getBgKey = useCallback(
    (type) => `bg_${type}_${userId}`,
    [userId]
  );

  const setThemeByColor = useCallback((value) => {
    const luminance = value.startsWith("#")
      ? getLuminance(value)
      : getGradientLuminance(value);

    document.documentElement.setAttribute(
      "data-theme",
      luminance > 0.4 ? "light" : "dark"
    );
  }, []);

  const clearAnimatedClasses = useCallback(() => {
    document.body.classList.remove(
      "animated-wave",
      "animated-particles",
      "animated-gradient",
      "animated-stars"
    );
  }, []);

  const applyBackground = useCallback(
    (value, type = "color") => {
      setActiveBg(value);

      clearAnimatedClasses();
      document.body.style.background = "";

      if (type === "animated") {
        document.body.classList.add(value);
        document.documentElement.setAttribute("data-theme", "dark");
      } else if (type === "image") {
        document.body.style.background = `url(${value}) center/cover no-repeat fixed`;
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.body.style.background = value;
        setThemeByColor(value);
      }

      if (userId) {
        localStorage.setItem(getBgKey("value"), value);
        localStorage.setItem(getBgKey("type"), type);
      }
    },
    [clearAnimatedClasses, getBgKey, setThemeByColor, userId]
  );

  const resetBackground = useCallback(() => {
    document.body.style.background = "";
    clearAnimatedClasses();
    document.documentElement.setAttribute("data-theme", "dark");

    if (userId) {
      localStorage.removeItem(getBgKey("value"));
      localStorage.removeItem(getBgKey("type"));
    }

    setActiveBg(null);
  }, [clearAnimatedClasses, getBgKey, userId]);

  useEffect(() => {
    if (!userId) return;

    const savedValue = localStorage.getItem(getBgKey("value"));
    const savedType = localStorage.getItem(getBgKey("type"));

    if (savedValue && savedType) {
      applyBackground(savedValue, savedType);
    }
  }, [userId, getBgKey, applyBackground]);

  return {
    activeBg,
    getBgKey,
    applyBackground,
    resetBackground,
  };
};