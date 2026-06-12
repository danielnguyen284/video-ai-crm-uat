// /api/projects/:projectId/files - Tài nguyên dự án: upload/xem/tải/xóa ảnh & video
const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { requireAuth, requireAuthFlexible } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");
const { upload, UPLOAD_DIR, ALLOWED } = require("../config/upload");

const router = express.Router({ mergeParams: true });

// Kiểm tra quyền truy cập dự án: Admin xem tất cả, Nhân viên chỉ dự án được phân công
async function assertProjectAccess(req, res) {
  const scope = req.user.role === "admin" ? "" : " AND assigned_to = ?";
  const params = req.user.role === "admin" ? [req.params.projectId] : [req.params.projectId, req.user.id];
  const [rows] = await pool.query(`SELECT id, title FROM projects WHERE id = ?${scope}`, params);
  if (!rows[0]) { res.status(403).json({ message: "Bạn không có quyền truy cập dự án này" }); return null; }
  return rows[0];
}

// GET /api/projects/:projectId/files - danh sách file
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const proj = await assertProjectAccess(req, res);
    if (!proj) return;
    const [rows] = await pool.query(
      "SELECT id, original_name, mime_type, size, file_type, created_at FROM project_files WHERE project_id = ? ORDER BY created_at DESC",
      [req.params.projectId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/projects/:projectId/files - tải lên nhiều file (field "files")
router.post("/", requireAuth, upload.array("files", 10), async (req, res, next) => {
  try {
    const proj = await assertProjectAccess(req, res);
    if (!proj) {
      (req.files || []).forEach(f => fs.unlink(f.path, () => {}));
      return;
    }
    if (!req.files?.length) return res.status(400).json({ message: "Không có file nào được tải lên" });

    const inserted = [];
    for (const f of req.files) {
      const fileType = ALLOWED[f.mimetype] || "image";
      const [r] = await pool.query(
        "INSERT INTO project_files (project_id, filename, original_name, mime_type, size, file_type, uploaded_by) VALUES (?,?,?,?,?,?,?)",
        [req.params.projectId, f.filename, f.originalname, f.mimetype, f.size, fileType, req.user.id]
      );
      inserted.push(r.insertId);
    }
    await logActivity(req.user.id, "create", "files", req.params.projectId,
      `Tải lên ${req.files.length} file cho dự án "${proj.title}"`);
    res.status(201).json({ message: "Tải lên thành công", ids: inserted });
  } catch (e) {
    if (e instanceof require("multer").MulterError || /Chỉ cho phép/.test(e.message)) {
      return res.status(400).json({ message: e.message });
    }
    next(e);
  }
});

// GET /api/projects/:projectId/files/:fileId/view - xem trực tiếp (ảnh/video), hỗ trợ ?token=
router.get("/:fileId/view", requireAuthFlexible, async (req, res, next) => {
  try {
    const proj = await assertProjectAccess(req, res);
    if (!proj) return;
    const [rows] = await pool.query("SELECT * FROM project_files WHERE id = ? AND project_id = ?", [req.params.fileId, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy file" });
    res.setHeader("Content-Type", rows[0].mime_type || "application/octet-stream");
    res.sendFile(path.join(UPLOAD_DIR, rows[0].filename));
  } catch (e) { next(e); }
});

// GET /api/projects/:projectId/files/:fileId/download - tải xuống, hỗ trợ ?token=
router.get("/:fileId/download", requireAuthFlexible, async (req, res, next) => {
  try {
    const proj = await assertProjectAccess(req, res);
    if (!proj) return;
    const [rows] = await pool.query("SELECT * FROM project_files WHERE id = ? AND project_id = ?", [req.params.fileId, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy file" });
    res.download(path.join(UPLOAD_DIR, rows[0].filename), rows[0].original_name);
  } catch (e) { next(e); }
});

// DELETE /api/projects/:projectId/files/:fileId
router.delete("/:fileId", requireAuth, async (req, res, next) => {
  try {
    const proj = await assertProjectAccess(req, res);
    if (!proj) return;
    const [rows] = await pool.query("SELECT * FROM project_files WHERE id = ? AND project_id = ?", [req.params.fileId, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ message: "Không tìm thấy file" });
    fs.unlink(path.join(UPLOAD_DIR, rows[0].filename), () => {});
    await pool.query("DELETE FROM project_files WHERE id = ?", [req.params.fileId]);
    await logActivity(req.user.id, "delete", "files", req.params.projectId,
      `Xóa file "${rows[0].original_name}" của dự án "${proj.title}"`);
    res.json({ message: "Đã xóa file" });
  } catch (e) { next(e); }
});

module.exports = router;
