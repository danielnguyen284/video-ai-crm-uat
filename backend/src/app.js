// Cấu hình Express app: middleware, routes, xử lý lỗi
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const customerRoutes = require("./routes/customers");
const projectRoutes = require("./routes/projects");
const resourceRoutes = require("./routes/resources");
const paymentRoutes = require("./routes/payments");
const logRoutes = require("./routes/logs");
const dashboardRoutes = require("./routes/dashboard");
const searchRoutes = require("./routes/search");
const notificationRoutes = require("./routes/notifications");
const settingsRoutes = require("./routes/settings");
const filesRoutes = require("./routes/files");
const storageRoutes = require("./routes/storage");

const app = express();

// Danh sách domain frontend được phép gọi API
const allowedOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",").map(s => s.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Không được phép truy cập từ domain này (CORS)"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

// Health check (dùng để kiểm tra server còn sống, ví dụ cho uptime monitor)
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects/:projectId/resources", resourceRoutes);
app.use("/api/projects/:projectId/files", filesRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/storage", storageRoutes);

// 404
app.use("/api", (req, res) => res.status(404).json({ message: "Không tìm thấy API endpoint" }));

// Xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message && err.message.includes("CORS"))
    return res.status(403).json({ message: err.message });
  res.status(err.status || 500).json({ message: err.message || "Lỗi server" });
});

module.exports = app;
