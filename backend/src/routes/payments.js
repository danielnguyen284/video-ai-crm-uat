// /api/payments - Thanh toán & công nợ (chỉ Admin được tạo/xóa giao dịch)
const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");
const { recalcRemaining } = require("../utils/recalc");

const router = express.Router();
router.use(requireAuth);

// GET /api/payments?project_id=
router.get("/", async (req, res, next) => {
  try {
    const { project_id } = req.query;
    const scope = req.user.role === "admin" ? "" : " AND pr.assigned_to = ?";
    const params = [];
    let sql = `SELECT pay.*, pr.title AS project_title, c.name AS customer_name, c.id AS customer_id
               FROM payments pay
               JOIN projects pr ON pr.id = pay.project_id
               JOIN customers c ON c.id = pr.customer_id
               WHERE 1=1`;
    if (project_id) { sql += " AND pay.project_id = ?"; params.push(project_id); }
    if (req.user.role !== "admin") { sql += scope; params.push(req.user.id); }
    sql += " ORDER BY pay.payment_date DESC, pay.id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/payments/debts - danh sách khách hàng còn công nợ (Admin)
router.get("/debts", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id AS customer_id, c.name AS customer_name,
              p.id AS project_id, p.title AS project_title, p.remaining
       FROM projects p JOIN customers c ON c.id = p.customer_id
       WHERE p.remaining > 0 AND p.status != 'huy'
       ORDER BY c.name`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/payments - ghi nhận thanh toán (Admin)
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.project_id || !b.amount || !b.payment_date)
      return res.status(400).json({ message: "Thiếu dự án, số tiền hoặc ngày thanh toán" });
    const [r] = await pool.query(
      "INSERT INTO payments (project_id, amount, payment_method, note, payment_date) VALUES (?,?,?,?,?)",
      [b.project_id, Number(b.amount), b.payment_method || "Chuyển khoản", b.note || null, b.payment_date]
    );
    await recalcRemaining(b.project_id);
    await logActivity(req.user.id, "create", "payments", r.insertId,
      `Ghi nhận thanh toán ${Number(b.amount).toLocaleString("vi-VN")} ₫ cho dự án #${b.project_id}`);
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

// DELETE /api/payments/:id (Admin)
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT project_id, amount FROM payments WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    await pool.query("DELETE FROM payments WHERE id = ?", [req.params.id]);
    await recalcRemaining(rows[0].project_id);
    await logActivity(req.user.id, "delete", "payments", req.params.id,
      `Xóa giao dịch ${Number(rows[0].amount).toLocaleString("vi-VN")} ₫ của dự án #${rows[0].project_id}`);
    res.json({ message: "Đã xóa" });
  } catch (e) { next(e); }
});

module.exports = router;
