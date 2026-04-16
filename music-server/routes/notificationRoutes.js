// src/routes/notificationRoutes.js
const express             = require("express");
const router              = express.Router();
const notificationService = require("../services/notificationService");
const { protect }         = require("../middleware/auth");

/* ── Test route ── */
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Notification route OK!" });
});

/* ── GET /api/notifications ── */
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Debug
    console.log(`📬 GET notifications - User: ${req.user.username} (${req.user._id})`);

    const result = await notificationService.getByUser(
      req.user._id,
      { page: Number(page), limit: Number(limit) }
    );

    console.log(`📬 Found: ${result.notifications.length}, Unread: ${result.unreadCount}`);

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ GET notifications error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════
   ⚠️ /read-all PHẢI trước /:id
   Nếu để sau, Express hiểu "read-all" là :id
══════════════════════════════════════════ */

/* ── PATCH /api/notifications/read-all ── */
router.patch("/read-all", protect, async (req, res) => {
  try {
    console.log(`📬 Mark ALL read - User: ${req.user.username}`);
    await notificationService.markAllAsRead(req.user._id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ markAllAsRead error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PATCH /api/notifications/:id/read ── */
router.patch("/:id/read", protect, async (req, res) => {
  try {
    console.log(`📬 Mark read - ID: ${req.params.id} - User: ${req.user.username}`);
    await notificationService.markAsRead(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ markAsRead error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/notifications/:id ── */
router.delete("/:id", protect, async (req, res) => {
  try {
    console.log(`📬 Hide notification - ID: ${req.params.id} - User: ${req.user.username}`);
    await notificationService.hide(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ hide notification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // ✅ Log chi tiết
    console.log("═".repeat(50));
    console.log("📬 GET /api/notifications");
    console.log("   req.user._id  :", req.user._id);
    console.log("   req.user.name :", req.user.username);
    console.log("   req.user.role :", req.user.role);
    console.log("═".repeat(50));

    const result = await notificationService.getByUser(
      req.user._id,
      { page: Number(page), limit: Number(limit) }
    );

    console.log("📬 Trả về:", result.notifications.length, "thông báo");
    console.log("📬 Unread :", result.unreadCount);

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

