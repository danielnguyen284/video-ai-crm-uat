// Cấu hình lưu trữ file tài nguyên dự án (ảnh / video) bằng Multer
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const UPLOAD_DIR = path.isAbsolute(process.env.UPLOAD_DIR || "")
  ? process.env.UPLOAD_DIR
  : path.join(__dirname, "../../", process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Chỉ cho phép: ảnh JPG/PNG/WEBP và video MP4/MOV
const ALLOWED = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/quicktime": "video", // .mov
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // tối đa 200MB / file
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new Error("Chỉ cho phép tải lên ảnh JPG/PNG/WEBP hoặc video MP4/MOV"));
  },
});

module.exports = { upload, UPLOAD_DIR, ALLOWED };
