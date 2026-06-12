// /api/notifications - Thông báo dự án sắp đến hạn & khách hàng còn công nợ
const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const scope = isAdmin ? "" : " AND p.assigned_to = ?";
    const params = isAdmin ? [] : [req.user.id];

    const [deadlines] = await pool.query(
      `SELECT p.id AS project_id, p.title, p.deadline, DATEDIFF(p.deadline, CURDATE()) AS days_left
       FROM projects p
       WHERE p.status NOT IN ('hoan_thanh','huy') AND p.deadline IS NOT NULL
         AND DATEDIFF(p.deadline, CURDATE()) <= 3 ${scope}
       ORDER BY p.deadline ASC`,
      params
    );

    let debts = [];
    if (isAdmin) {
      const [rows] = await pool.query(
        `SELECT p.id AS project_id, p.title, p.remaining, c.name AS customer_name
         FROM projects p JOIN customers c ON c.id = p.customer_id
         WHERE p.status = 'hoan_thanh' AND p.remaining > 0
         ORDER BY p.remaining DESC`
      );
      debts = rows;
    }

    res.json({ deadlines, debts });
  } catch (e) { next(e); }
});

module.exports = router;
