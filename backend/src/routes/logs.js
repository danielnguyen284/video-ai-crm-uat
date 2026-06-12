// /api/logs - Lịch sử hoạt động hệ thống
const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin); // Chỉ Admin xem được toàn bộ lịch sử

// GET /api/logs?module=&limit=
router.get("/", async (req, res, next) => {
  try {
    const { module, limit = 200 } = req.query;
    let sql = `SELECT l.*, u.name AS user_name FROM activity_logs l
               LEFT JOIN users u ON u.id = l.user_id WHERE 1=1`;
    const params = [];
    if (module) { sql += " AND l.module = ?"; params.push(module); }
    sql += " ORDER BY l.created_at DESC LIMIT ?";
    params.push(Math.min(Number(limit) || 200, 1000));
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
