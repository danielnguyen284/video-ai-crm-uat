// /api/storage - Quản lý dung lượng file tài nguyên dự án (chỉ Admin)
const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");
const { UPLOAD_DIR } = require("../config/upload");

const router = express.Router();
router.use(requireAuth, requireAdmin);

const QUOTA_BYTES = (Number(process.env.STORAGE_QUOTA_GB) || 5) * 1024 * 1024 * 1024;

// GET /api/storage/overview - Tổng dung lượng / Đã sử dụng / Còn trống
router.get("/overview", async (req, res, next) => {
  try {
    const [[{ used }]] = await pool.query("SELECT IFNULL(SUM(size),0) AS used FROM project_files");
    const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM project_files");
    const usedNum = Number(used);
    res.json({ total: QUOTA_BYTES, used: usedNum, free: Math.max(0, QUOTA_BYTES - usedNum), fileCount: count });
  } catch (e) { next(e); }
});

// GET /api/storage/files?sort=oldest|newest|largest
router.get("/files", async (req, res, next) => {
  try {
    let order = "f.created_at DESC"; // mới nhất (mặc định)
    if (req.query.sort === "oldest") order = "f.created_at ASC";
    if (req.query.sort === "largest") order = "f.size DESC";
    const [rows] = await pool.query(
      `SELECT f.id, f.original_name, f.size, f.file_type, f.created_at, f.project_id, p.title AS project_title
       FROM project_files f JOIN projects p ON p.id = f.project_id
       ORDER BY ${order}`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/storage/old-files?days=90 - đề xuất xóa file cũ
router.get("/old-files", async (req, res, next) => {
  try {
    const days = Math.max(1, Number(req.query.days) || 90);
    const [rows] = await pool.query(
      `SELECT f.id, f.original_name, f.size, f.created_at, f.project_id, p.title AS project_title
       FROM project_files f JOIN projects p ON p.id = f.project_id
       WHERE f.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY f.created_at ASC`,
      [days]
    );
    const totalSize = rows.reduce((s, r) => s + Number(r.size), 0);
    res.json({ days, files: rows, totalSize });
  } catch (e) { next(e); }
});

// POST /api/storage/delete - xóa nhiều file đã chọn (Admin phải xác nhận ở giao diện, KHÔNG tự động)
router.post("/delete", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ message: "Chưa chọn file nào để xóa" });
    const [rows] = await pool.query(`SELECT * FROM project_files WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
    rows.forEach(f => fs.unlink(path.join(UPLOAD_DIR, f.filename), () => {}));
    await pool.query(`DELETE FROM project_files WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
    const freed = rows.reduce((s, r) => s + Number(r.size), 0);
    await logActivity(req.user.id, "delete", "files", "bulk",
      `Xóa ${rows.length} file, giải phóng ${(freed / (1024 * 1024)).toFixed(1)} MB dung lượng`);
    res.json({ message: "Đã xóa", count: rows.length, freed });
  } catch (e) { next(e); }
});

module.exports = router;
