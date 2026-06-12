// Xác thực JWT + phân quyền
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Bắt buộc đăng nhập: đọc token từ header "Authorization: Bearer <token>"
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, name, email, role, position, status FROM users WHERE id = ?",
      [payload.id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Tài khoản không tồn tại" });
    if (user.status === "locked")
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

// Chỉ cho phép Admin
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Chỉ Admin được phép thực hiện thao tác này" });
  next();
}

// Xác thực linh hoạt: chấp nhận token qua header Authorization HOẶC query string ?token=
// Dùng cho các đường dẫn được gắn trực tiếp vào <img>, <video>, <a download> (không gửi được header)
async function requireAuthFlexible(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, name, email, role, position, status FROM users WHERE id = ?",
      [payload.id]
    );
    const user = rows[0];
    if (!user || user.status === "locked")
      return res.status(401).json({ message: "Không có quyền truy cập" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

module.exports = { requireAuth, requireAdmin, requireAuthFlexible };
