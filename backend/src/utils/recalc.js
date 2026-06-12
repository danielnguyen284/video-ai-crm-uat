// Tự động tính lại cột remaining (còn nợ) của dự án = price - tổng thanh toán
const pool = require("../config/db");

async function recalcRemaining(projectId) {
  await pool.query(
    `UPDATE projects p
     SET p.remaining = GREATEST(0, p.price - IFNULL(
       (SELECT SUM(amount) FROM payments WHERE project_id = p.id), 0))
     WHERE p.id = ?`,
    [projectId]
  );
}

module.exports = { recalcRemaining };
