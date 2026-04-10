// src/hooks/useLRC.js

/**
 * Parse chuỗi LRC thành mảng { time, text }
 * [mm:ss.xx] hoặc [mm:ss]
 */
export const parseLRC = (lrcText) => {
  if (!lrcText) return null;

  const lines = lrcText.split("\n");
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{0,2})\]/g;
  const result = [];

  lines.forEach((line) => {
    const times = [];
    let match;

    // Reset regex
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3] || "0");
      const time = minutes * 60 + seconds + centiseconds / 100;
      times.push(time);
    }

    // Lấy phần text (bỏ tất cả timestamp)
    const text = line.replace(/\[\d{2}:\d{2}\.?\d{0,2}\]/g, "").trim();

    if (times.length > 0 && text) {
      times.forEach((t) => result.push({ time: t, text }));
    }
  });

  // Sắp xếp theo thời gian
  return result.sort((a, b) => a.time - b.time);
};

/**
 * Kiểm tra lyrics có phải LRC format không
 */
export const isLRCFormat = (text) => {
  if (!text) return false;
  return /\[\d{2}:\d{2}/.test(text);
};