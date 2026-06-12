// /api/customers - Quản lý khách hàng
// Nhân viên: chỉ thấy khách được phân công hoặc do mình tạo; không được xóa.
const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");

const router = express.Router();
router.use(requireAuth);

// Điều kiện giới hạn phạm vi cho nhân viên
function scopeSql(user) {
  return user.role === "admin"
    ? { sql: "", params: [] }
    : { sql: " AND (c.assigned_to = ? OR c.created_by = ?)", params: [user.id, user.id] };
}

// GET /api/customers?q=&status=&source=
router.get("/", async (req, res, next) => {
  try {
    const { q, status, source } = req.query;
    const scope = scopeSql(req.user);
    let sql = `SELECT c.*, u.name AS assigned_name
               FROM customers c LEFT JOIN users u ON u.id = c.assigned_to
               WHERE 1=1 ${scope.sql}`;
    const params = [...scope.params];
    if (q)      { sql += " AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)"; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (status) { sql += " AND c.status = ?"; params.push(status); }
    if (source) { sql += " AND c.source = ?"; params.push(source); }
    sql += " ORDER BY c.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/customers/:id (kèm danh sách dự án của khách)
router.get("/:id", async (req, res, next) => {
  try {
    const scope = scopeSql(req.user);
    const [rows] = await pool.query(
      `SELECT c.* FROM customers c WHERE c.id = ? ${scope.sql}`,
      [req.params.id, ...scope.params]
    );
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    const [projects] = await pool.query(
      "SELECT id, title, status, price, remaining, deadline FROM projects WHERE customer_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json({ ...rows[0], projects });
  } catch (e) { next(e); }
});

// POST /api/customers
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name || !b.phone) return res.status(400).json({ message: "Thiếu họ tên hoặc số điện thoại" });
    const [r] = await pool.query(
      `INSERT INTO customers (name, phone, facebook, zalo, email, address, industry, source, status, note, assigned_to, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [b.name, b.phone, b.facebook || null, b.zalo || null, b.email || null, b.address || null,
       b.industry || null, b.source || "Khác", b.status || "tiem_nang", b.note || null,
       b.assigned_to || null, req.user.id]
    );
    await logActivity(req.user.id, "create", "customers", r.insertId, `Tạo khách hàng ${b.name}`);
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

// PUT /api/customers/:id
router.put("/:id", async (req, res, next) => {
  try {
    const scope = scopeSql(req.user);
    const [own] = await pool.query(`SELECT id, name FROM customers c WHERE c.id = ? ${scope.sql}`,
      [req.params.id, ...scope.params]);
    if (!own[0]) return res.status(403).json({ message: "Bạn không có quyền sửa khách hàng này" });

    const b = req.body || {};
    await pool.query(
      `UPDATE customers SET name=?, phone=?, facebook=?, zalo=?, email=?, address=?,
       industry=?, source=?, status=?, note=?, assigned_to=? WHERE id=?`,
      [b.name, b.phone, b.facebook || null, b.zalo || null, b.email || null, b.address || null,
       b.industry || null, b.source || "Khác", b.status || "tiem_nang", b.note || null,
       b.assigned_to || null, req.params.id]
    );
    await logActivity(req.user.id, "update", "customers", req.params.id, `Cập nhật khách hàng ${b.name}`);
    res.json({ message: "Đã cập nhật" });
  } catch (e) { next(e); }
});

// DELETE /api/customers/:id - chỉ Admin
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT name FROM customers WHERE id = ?", [req.params.id]);
    await pool.query("DELETE FROM customers WHERE id = ?", [req.params.id]);
    await logActivity(req.user.id, "delete", "customers", req.params.id,
      `Xóa khách hàng ${rows[0]?.name || "#" + req.params.id}`);
    res.json({ message: "Đã xóa" });
  } catch (e) { next(e); }
});

module.exports = router;
