const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth"); // ✅ dùng đúng middleware của bạn
const {
  getTrash,
  restore,
  permanentDelete,
} = require("../controllers/trashController");

// GET    /api/trash              → danh sách thùng rác
// PUT    /api/trash/:id/restore  → khôi phục
// DELETE /api/trash/:id/permanent → xóa vĩnh viễn
router.get   ("/",                   protect, getTrash);
router.put   ("/:trashId/restore",   protect, restore);
router.delete("/:trashId/permanent", protect, permanentDelete);

module.exports = router;