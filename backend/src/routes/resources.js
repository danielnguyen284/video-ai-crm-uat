// /api/projects/:projectId/resources - Tài nguyên sản xuất video (link + prompt + kịch bản + caption)
const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

const FIELDS = [
  "drive_link","capcut_link","canva_link","chatgpt_link","gemini_link","kling_link","hailuo_link",
  "delivery_video_link","image_prompt","video_prompt","script_content","facebook_caption","tiktok_caption","hashtags"
];

async function assertProjectAccess(req, res) {
  const scope = req.user.role === "admin" ? "" : " AND assigned_to = ?";
  const params = req.user.role === "admin" ? [req.params.projectId] : [req.params.projectId, req.user.id];
  const [rows] = await pool.query(`SELECT id, title FROM projects WHERE id = ?${scope}`, params);
  if (!rows[0]) { res.status(403).json({ message: "Bạn không có quyền truy cập dự án này" }); return null; }
  return rows[0];
}

// GET /api/projects/:projectId/resources
router.get("/", async (req, res, next) => {
  try {
    const proj = await assertProjectAccess(req, res);
    if (!proj) return;
    const [rows] = await pool.query("SELECT * FROM project_resources WHERE project_id = ?", [req.params.projectId]);
    res.json(rows[0] || { project_id: Number(req.params.projectId) });
  } catch (e) { next(e); }
});

// PUT /api/projects/:projectId/resources - tạo hoặc cập nhật (upsert)
router.put("/", async (req, res, next) => {
  try {
    const proj = await assertProjectAccess(req, res);
    if (!proj) return;
    const b = req.body || {};
    const values = FIELDS.map(f => b[f] ?? null);

    const cols = FIELDS.join(", ");
    const placeholders = FIELDS.map(() => "?").join(", ");
    const updates = FIELDS.map(f => `${f} = VALUES(${f})`).join(", ");

    await pool.query(
      `INSERT INTO project_resources (project_id, ${cols}) VALUES (?, ${placeholders})
       ON DUPLICATE KEY UPDATE ${updates}`,
      [req.params.projectId, ...values]
    );
    await logActivity(req.user.id, "update", "resources", req.params.projectId,
      `Cập nhật tài nguyên dự án "${proj.title}"`);
    res.json({ message: "Đã lưu tài nguyên" });
  } catch (e) { next(e); }
});

module.exports = router;
