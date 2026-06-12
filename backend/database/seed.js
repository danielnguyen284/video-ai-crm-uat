// Script tạo tài khoản Admin đầu tiên + dữ liệu mẫu (chạy: npm run seed)
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

async function run() {
  const conn = await pool.getConnection();
  try {
    // 1) Tài khoản Admin mặc định
    const [exists] = await conn.query("SELECT id FROM users WHERE email = ?", ["admin@crm.vn"]);
    if (!exists[0]) {
      const hash = await bcrypt.hash("admin123", 10);
      await conn.query(
        "INSERT INTO users (name, email, phone, password, role, position, status) VALUES (?,?,?,?,?,?,?)",
        ["Quản trị viên", "admin@crm.vn", "0900000001", hash, "admin", "Administrator", "active"]
      );
      console.log("✅ Đã tạo tài khoản Admin: admin@crm.vn / admin123 (đổi mật khẩu ngay sau khi đăng nhập!)");
    } else {
      console.log("ℹ️  Tài khoản Admin (admin@crm.vn) đã tồn tại, bỏ qua.");
    }

    // 2) Một nhân viên mẫu
    const [staffExists] = await conn.query("SELECT id FROM users WHERE email = ?", ["nhanvien@crm.vn"]);
    if (!staffExists[0]) {
      const hash = await bcrypt.hash("123456", 10);
      await conn.query(
        "INSERT INTO users (name, email, phone, password, role, position, status) VALUES (?,?,?,?,?,?,?)",
        ["Trần Minh Khoa", "nhanvien@crm.vn", "0900000002", hash, "staff", "Editor Video AI", "active"]
      );
      console.log("✅ Đã tạo nhân viên mẫu: nhanvien@crm.vn / 123456");
    }

    console.log("🎉 Seed hoàn tất.");
  } finally {
    conn.release();
    process.exit(0);
  }
}

run().catch(e => { console.error("❌ Seed lỗi:", e); process.exit(1); });
