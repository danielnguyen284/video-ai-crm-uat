// /api/settings - Cài đặt hệ thống (Admin)
// Hiện tại: mẫu link mặc định (ChatGPT, Gemini, Kling AI, Hailuo AI, CapCut)
// tự động điền vào tài nguyên của mọi dự án mới được tạo.
const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");

const router = express.Router();
router.use(requireAuth, requireAdmin);

const FIELDS = ["chatgpt_link", "gemini_link", "kling_link", "hailuo_link", "capcut_link"];

// GET /api/settings/default-resources
router.get("/default-resources", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM default_resources WHERE id = 1");
    res.json(rows[0] || { id: 1 });
  } catch (e) { next(e); }
});

// PUT /api/settings/default-resources
router.put("/default-resources", async (req, res, next) => {
  try {
    const b = req.body || {};
    const values = FIELDS.map(f => b[f] || null);
    const placeholders = FIELDS.map(() => "?").join(", ");
    const updates = FIELDS.map(f => `${f} = VALUES(${f})`).join(", ");
    await pool.query(
      `INSERT INTO default_resources (id, ${FIELDS.join(", ")}) VALUES (1, ${placeholders})
       ON DUPLICATE KEY UPDATE ${updates}`,
      values
    );
    await logActivity(req.user.id, "update", "settings", "default_resources",
      "Cập nhật mẫu link mặc định cho dự án mới");
    res.json({ message: "Đã lưu cài đặt" });
  } catch (e) { next(e); }
});

module.exports = router;
