// /api/projects - Quản lý dự án Video AI (danh sách + Kanban)
// Nhân viên: chỉ thấy dự án được phân công cho mình; không được xóa.
const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");
const { UPLOAD_DIR } = require("../config/upload");

const router = express.Router();
router.use(requireAuth);

const STATUSES = ["moi_nhan","kich_ban","anh_ai","video_ai","chinh_sua","cho_duyet","hoan_thanh","huy"];

function scopeSql(user) {
  return user.role === "admin" ? { sql: "", params: [] } : { sql: " AND p.assigned_to = ?", params: [user.id] };
}

// GET /api/projects?q=&status=&customer_id=&assigned_to=
router.get("/", async (req, res, next) => {
  try {
    const { q, status, customer_id, assigned_to } = req.query;
    const scope = scopeSql(req.user);
    let sql = `SELECT p.*, c.name AS customer_name, u.name AS assigned_name
               FROM projects p
               LEFT JOIN customers c ON c.id = p.customer_id
               LEFT JOIN users u ON u.id = p.assigned_to
               WHERE 1=1 ${scope.sql}`;
    const params = [...scope.params];
    if (q) { sql += " AND (p.title LIKE ? OR c.name LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
    if (status) { sql += " AND p.status = ?"; params.push(status); }
    if (customer_id) { sql += " AND p.customer_id = ?"; params.push(customer_id); }
    if (assigned_to) { sql += " AND p.assigned_to = ?"; params.push(assigned_to); }
    sql += " ORDER BY p.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/projects/:id (kèm thanh toán + tài nguyên)
router.get("/:id", async (req, res, next) => {
  try {
    const scope = scopeSql(req.user);
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS customer_name, u.name AS assigned_name
       FROM projects p LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN users u ON u.id = p.assigned_to
       WHERE p.id = ? ${scope.sql}`,
      [req.params.id, ...scope.params]
    );
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy dự án" });
    const [payments] = await pool.query(
      "SELECT * FROM payments WHERE project_id = ? ORDER BY payment_date DESC", [req.params.id]);
    const [resources] = await pool.query(
      "SELECT * FROM project_resources WHERE project_id = ?", [req.params.id]);
    res.json({ ...rows[0], payments, resources: resources[0] || null });
  } catch (e) { next(e); }
});

// POST /api/projects
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.title || !b.customer_id) return res.status(400).json({ message: "Thiếu tên dự án hoặc khách hàng" });
    const price = Number(b.price || 0), deposit = Number(b.deposit || 0);
    const status = STATUSES.includes(b.status) ? b.status : "moi_nhan";
    const [r] = await pool.query(
      `INSERT INTO projects (customer_id, assigned_to, title, description, price, deposit, remaining, status, start_date, deadline)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [b.customer_id, b.assigned_to || null, b.title, b.description || null, price, deposit,
       Math.max(0, price), status, b.start_date || null, b.deadline || null]
    );

    // Tự động điền tài nguyên: mẫu link mặc định (Admin cấu hình trong Cài đặt hệ thống)
    // Google Drive dự án / Video bàn giao đã được thay bằng module "Tài nguyên dự án" (upload file)
    const [defRows] = await pool.query("SELECT * FROM default_resources WHERE id = 1");
    const def = defRows[0] || {};
    await pool.query(
      `INSERT INTO project_resources (project_id, chatgpt_link, gemini_link, kling_link, hailuo_link, capcut_link)
       VALUES (?,?,?,?,?,?)`,
      [r.insertId, def.chatgpt_link || null, def.gemini_link || null,
       def.kling_link || null, def.hailuo_link || null, def.capcut_link || null]
    );

    await logActivity(req.user.id, "create", "projects", r.insertId, `Tạo dự án "${b.title}"`);
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

// PUT /api/projects/:id
router.put("/:id", async (req, res, next) => {
  try {
    const scope = scopeSql(req.user);
    const [own] = await pool.query(`SELECT p.status, p.title FROM projects p WHERE p.id = ? ${scope.sql}`,
      [req.params.id, ...scope.params]);
    if (!own[0]) return res.status(403).json({ message: "Bạn không có quyền sửa dự án này" });

    const b = req.body || {};
    const price = Number(b.price || 0), deposit = Number(b.deposit || 0);
    const status = STATUSES.includes(b.status) ? b.status : own[0].status;
    await pool.query(
      `UPDATE projects SET customer_id=?, assigned_to=?, title=?, description=?, price=?, deposit=?,
       status=?, start_date=?, deadline=? WHERE id=?`,
      [b.customer_id, b.assigned_to || null, b.title, b.description || null, price, deposit,
       status, b.start_date || null, b.deadline || null, req.params.id]
    );
    // Đồng bộ lại "còn nợ" theo giá hợp đồng mới
    await pool.query(
      `UPDATE projects p SET p.remaining = GREATEST(0, p.price - IFNULL(
         (SELECT SUM(amount) FROM payments WHERE project_id = p.id), 0)) WHERE p.id = ?`,
      [req.params.id]
    );
    if (status !== own[0].status)
      await logActivity(req.user.id, "update", "projects", req.params.id, `Chuyển trạng thái "${b.title}" → ${status}`);
    else
      await logActivity(req.user.id, "update", "projects", req.params.id, `Cập nhật dự án "${b.title}"`);
    res.json({ message: "Đã cập nhật" });
  } catch (e) { next(e); }
});

// PATCH /api/projects/:id/status - dùng riêng cho kéo-thả Kanban
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    const scope = scopeSql(req.user);
    const [own] = await pool.query(`SELECT title FROM projects p WHERE p.id = ? ${scope.sql}`,
      [req.params.id, ...scope.params]);
    if (!own[0]) return res.status(403).json({ message: "Bạn không có quyền cập nhật dự án này" });
    await pool.query("UPDATE projects SET status = ? WHERE id = ?", [status, req.params.id]);
    await logActivity(req.user.id, "update", "projects", req.params.id, `Chuyển trạng thái "${own[0].title}" → ${status}`);
    res.json({ message: "Đã cập nhật trạng thái" });
  } catch (e) { next(e); }
});

// DELETE /api/projects/:id - chỉ Admin (CASCADE xóa payments + resources + files)
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT title FROM projects WHERE id = ?", [req.params.id]);
    // Xóa file vật lý trên đĩa trước khi CASCADE xóa bản ghi project_files
    const [files] = await pool.query("SELECT filename FROM project_files WHERE project_id = ?", [req.params.id]);
    files.forEach(f => fs.unlink(path.join(UPLOAD_DIR, f.filename), () => {}));
    await pool.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
    await logActivity(req.user.id, "delete", "projects", req.params.id,
      `Xóa dự án "${rows[0]?.title || "#" + req.params.id}"`);
    res.json({ message: "Đã xóa" });
  } catch (e) { next(e); }
});

module.exports = router;
