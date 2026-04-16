// src/utils/dynamicFavicon.js

/**
 * ✅ Vẽ favicon từ ảnh bìa bài hát
 */
export const setFaviconWithStatus = (coverUrl, isPlaying) => {
  const canvas  = document.createElement("canvas");
  canvas.width  = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");

  const img    = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    ctx.clearRect(0, 0, 32, 32);

    // ── Vẽ ảnh bìa hình tròn ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, 32, 32);
    ctx.restore();

    // ── Viền màu theo trạng thái ──
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.strokeStyle = isPlaying ? "#1db954" : "#999999";
    ctx.lineWidth   = 2;
    ctx.stroke();

    // ── Chấm tròn góc dưới phải ──
    ctx.beginPath();
    ctx.arc(25, 25, 6, 0, Math.PI * 2);
    ctx.fillStyle = isPlaying ? "#1db954" : "#999999";
    ctx.fill();

    // ── Icon play/pause bên trong chấm ──
    ctx.fillStyle = "#ffffff";
    if (isPlaying) {
      // Icon pause: 2 vạch
      ctx.fillRect(22, 22, 2.5, 6);
      ctx.fillRect(26, 22, 2.5, 6);
    } else {
      // Icon play: tam giác
      ctx.beginPath();
      ctx.moveTo(23, 22);
      ctx.lineTo(23, 28);
      ctx.lineTo(29, 25);
      ctx.closePath();
      ctx.fill();
    }

    updateFavicon(canvas.toDataURL("image/png"));
  };

  img.onerror = () => resetFavicon();
  img.src     = coverUrl;
};

/**
 * ✅ Cập nhật thẻ link favicon
 */
const updateFavicon = (dataUrl) => {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link      = document.createElement("link");
    link.rel  = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  link.href = dataUrl;
};

/**
 * ✅ Reset về favicon mặc định
 */
export const resetFavicon = () => {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link     = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = "/logo.gif"; // ← favicon mặc định của bạn
};

/**
 * ✅ Đổi title tab
 */
export const setPageTitle = (songTitle, artistName, isPlaying) => {
  if (!songTitle) {
    document.title = "ChillWithF 🎵";
    return;
  }
  const icon     = isPlaying ? "▶" : "⏸";
  document.title = `${icon} ${songTitle} — ${artistName} | ChillWithF`;
};