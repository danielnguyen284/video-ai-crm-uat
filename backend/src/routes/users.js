// /api/users - Quản lý nhân viên (chỉ Admin)
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");

const router = express.Router();
router.use(requireAuth);

// GET /api/users - mọi người dùng đều xem được danh sách (để chọn người phụ trách)
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role, position, avatar, status, created_at FROM users ORDER BY name"
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/users - thêm nhân viên (Admin)
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, email, phone, position, role = "staff", password = "123456" } = req.body || {};
    if (!name || !email) return res.status(400).json({ message: "Thiếu họ tên hoặc email" });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      "INSERT INTO users (name, email, phone, position, role, password) VALUES (?,?,?,?,?,?)",
      [name, email, phone || null, position || null, role === "admin" ? "admin" : "staff", hash]
    );
    await logActivity(req.user.id, "create", "users", r.insertId, `Thêm nhân viên ${name}`);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email đã tồn tại" });
    next(e);
  }
});

// PUT /api/users/:id - cập nhật thông tin (Admin)
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { name, email, phone, position, role } = req.body || {};
    await pool.query(
      "UPDATE users SET name=?, email=?, phone=?, position=?, role=? WHERE id=?",
      [name, email, phone || null, position || null, role === "admin" ? "admin" : "staff", req.params.id]
    );
    await logActivity(req.user.id, "update", "users", req.params.id, `Cập nhật nhân viên ${name}`);
    res.json({ message: "Đã cập nhật" });
  } catch (e) { next(e); }
});

// PUT /api/users/:id/lock - khóa / mở khóa (Admin)
router.put("/:id/lock", requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body || {}; // 'active' | 'locked'
    if (Number(req.params.id) === req.user.id)
      return res.status(400).json({ message: "Không thể thao tác với tài khoản hiện tại." });
    const [rows] = await pool.query("SELECT name FROM users WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    const ns = status === "locked" ? "locked" : "active";
    await pool.query("UPDATE users SET status = ? WHERE id = ?", [ns, req.params.id]);
    await logActivity(req.user.id, "update", "users", req.params.id,
      `${ns === "locked" ? "Khóa" : "Mở khóa"} tài khoản ${rows[0].name}`);
    res.json({ message: "Đã cập nhật trạng thái" });
  } catch (e) { next(e); }
});

// PUT /api/users/:id/reset-password (Admin) - Admin tự đặt mật khẩu mới cho nhân viên
router.put("/:id/reset-password", requireAdmin, async (req, res, next) => {
  try {
    const newPass = (req.body && req.body.new_password) || "";
    if (newPass.length < 6) return res.status(400).json({ message: "Mật khẩu mới phải từ 6 ký tự" });
    const [rows] = await pool.query("SELECT name FROM users WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    const hash = await bcrypt.hash(newPass, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hash, req.params.id]);
    await logActivity(req.user.id, "update", "users", req.params.id, `Đổi mật khẩu cho ${rows[0].name}`);
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (e) { next(e); }
});

// DELETE /api/users/:id - Xóa nhân viên (Admin)
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id)
      return res.status(400).json({ message: "Không thể thao tác với tài khoản hiện tại." });
    const [rows] = await pool.query("SELECT name FROM users WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    await logActivity(req.user.id, "delete", "users", req.params.id, `Xóa nhân viên ${rows[0].name}`);
    res.json({ message: "Đã xóa nhân viên" });
  } catch (e) { next(e); }
});

module.exports = router;
