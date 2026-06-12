// /api/auth - Đăng nhập, thông tin tài khoản, đổi mật khẩu
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email.trim()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    if (user.status === "locked")
      return res.status(403).json({ message: "Tài khoản đã bị khóa. Liên hệ Admin." });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "7d"
    });
    await logActivity(user.id, "login", "users", user.id, `${user.name} đăng nhập hệ thống`);
    const { password: _, ...safe } = user;
    res.json({ token, user: safe });
  } catch (e) { next(e); }
});

// GET /api/auth/me - thông tin người đang đăng nhập
router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

// PUT /api/auth/me - tự cập nhật thông tin cá nhân (mọi vai trò; không đổi được email/vai trò)
router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, phone, position } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ message: "Thiếu họ tên" });
    await pool.query("UPDATE users SET name = ?, phone = ?, position = ? WHERE id = ?",
      [name.trim(), phone || null, position || null, req.user.id]);
    await logActivity(req.user.id, "update", "users", req.user.id, `${name.trim()} cập nhật thông tin cá nhân`);
    const [rows] = await pool.query("SELECT id, name, email, phone, role, position, avatar, status FROM users WHERE id = ?", [req.user.id]);
    res.json({ user: rows[0] });
  } catch (e) { next(e); }
});

// PUT /api/auth/change-password
router.put("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body || {};
    if (!new_password || new_password.length < 6)
      return res.status(400).json({ message: "Mật khẩu mới phải từ 6 ký tự" });
    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (!(await bcrypt.compare(old_password || "", rows[0].password)))
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hash, req.user.id]);
    res.json({ message: "Đã đổi mật khẩu" });
  } catch (e) { next(e); }
});

module.exports = router;
