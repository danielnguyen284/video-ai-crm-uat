// Ghi lịch sử hoạt động vào bảng activity_logs
const pool = require("../config/db");

async function logActivity(userId, action, module, recordId, description) {
  try {
    await pool.query(
      "INSERT INTO activity_logs (user_id, action, module, record_id, description) VALUES (?,?,?,?,?)",
      [userId || null, action, module, String(recordId ?? ""), description]
    );
  } catch (e) {
    console.error("Không ghi được activity log:", e.message);
  }
}

module.exports = { logActivity };
