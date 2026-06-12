// /api/search?q= - Tìm kiếm toàn hệ thống (khách hàng, dự án, theo SĐT/tên/nhân viên)
const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ customers: [], projects: [] });
    const like = `%${q}%`;
    const isAdmin = req.user.role === "admin";

    let custSql = `SELECT id, name, phone, status FROM customers WHERE (name LIKE ? OR phone LIKE ?)`;
    const custParams = [like, like];
    if (!isAdmin) { custSql += " AND (assigned_to = ? OR created_by = ?)"; custParams.push(req.user.id, req.user.id); }
    custSql += " LIMIT 8";

    let projSql = `SELECT p.id, p.title, p.status, u.name AS assigned_name
                    FROM projects p LEFT JOIN users u ON u.id = p.assigned_to
                    WHERE (p.title LIKE ? OR u.name LIKE ?)`;
    const projParams = [like, like];
    if (!isAdmin) { projSql += " AND p.assigned_to = ?"; projParams.push(req.user.id); }
    projSql += " LIMIT 8";

    const [customers] = await pool.query(custSql, custParams);
    const [projects] = await pool.query(projSql, projParams);
    res.json({ customers, projects });
  } catch (e) { next(e); }
});

module.exports = router;
