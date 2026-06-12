// /api/dashboard - Số liệu tổng quan + biểu đồ
const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const projScope = isAdmin ? "" : "WHERE p.assigned_to = " + req.user.id;

    const [[{ totalCustomers }]] = await pool.query(
      isAdmin
        ? "SELECT COUNT(*) AS totalCustomers FROM customers"
        : "SELECT COUNT(*) AS totalCustomers FROM customers WHERE assigned_to = ? OR created_by = ?",
      isAdmin ? [] : [req.user.id, req.user.id]
    );
    const [[projStats]] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(status NOT IN ('hoan_thanh','huy')) AS active,
              SUM(status = 'hoan_thanh') AS done
       FROM projects p ${projScope}`
    );

    let revenueStats = { total: 0, month: 0, debt: 0 };
    let monthly = [];
    if (isAdmin) {
      const [[r]] = await pool.query("SELECT IFNULL(SUM(amount),0) AS total FROM payments");
      const [[m]] = await pool.query(
        "SELECT IFNULL(SUM(amount),0) AS month FROM payments WHERE YEAR(payment_date)=YEAR(CURDATE()) AND MONTH(payment_date)=MONTH(CURDATE())"
      );
      const [[d]] = await pool.query("SELECT IFNULL(SUM(remaining),0) AS debt FROM projects WHERE status != 'huy'");
      revenueStats = { total: Number(r.total), month: Number(m.month), debt: Number(d.debt) };

      const [rows] = await pool.query(
        `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS ym, SUM(amount) AS total
         FROM payments
         WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
         GROUP BY ym ORDER BY ym`
      );
      monthly = rows.map(r => ({ month: r.ym, revenue: Number(r.total) }));
    }

    const [statusRows] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM projects p ${projScope} GROUP BY status`
    );

    const [dueSoon] = await pool.query(
      `SELECT p.id, p.title, p.status, p.deadline,
              DATEDIFF(p.deadline, CURDATE()) AS days_left
       FROM projects p ${projScope ? projScope + " AND" : "WHERE"}
            p.status NOT IN ('hoan_thanh','huy') AND p.deadline IS NOT NULL
            AND DATEDIFF(p.deadline, CURDATE()) <= 5
       ORDER BY p.deadline ASC LIMIT 20`
    );

    res.json({
      totalCustomers,
      totalProjects: Number(projStats.total || 0),
      activeProjects: Number(projStats.active || 0),
      doneProjects: Number(projStats.done || 0),
      revenue: revenueStats,
      monthlyRevenue: monthly,
      projectStatus: statusRows,
      dueSoon
    });
  } catch (e) { next(e); }
});

module.exports = router;
