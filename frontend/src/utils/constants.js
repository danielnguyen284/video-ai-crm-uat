import { Bot, Sparkles, Clapperboard, Video, Scissors } from "lucide-react";

export const CUSTOMER_STATUS = {
  tiem_nang: { label: "Khách tiềm năng", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  tu_van:    { label: "Đang tư vấn",     color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  da_chot:   { label: "Đã chốt",         color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  khach_cu:  { label: "Khách cũ",        color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-300" },
};
export const SOURCES = ["Facebook", "TikTok", "Google", "Giới thiệu", "Khác"];

export const PROJECT_STATUS = {
  moi_nhan:   { label: "Mới nhận",       dot: "#64748b", col: "border-slate-400" },
  kich_ban:   { label: "Viết kịch bản",  dot: "#8b5cf6", col: "border-violet-500" },
  anh_ai:     { label: "Tạo ảnh AI",     dot: "#06b6d4", col: "border-cyan-500" },
  video_ai:   { label: "Tạo video AI",   dot: "#3b82f6", col: "border-blue-500" },
  chinh_sua:  { label: "Chỉnh sửa",      dot: "#f59e0b", col: "border-amber-500" },
  cho_duyet:  { label: "Chờ khách duyệt",dot: "#ec4899", col: "border-pink-500" },
  hoan_thanh: { label: "Hoàn thành",     dot: "#10b981", col: "border-emerald-500" },
  huy:        { label: "Hủy",            dot: "#ef4444", col: "border-red-500" },
};
export const PAYMENT_METHODS = ["Chuyển khoản", "Tiền mặt", "Momo", "ZaloPay", "Khác"];

export const RESOURCE_LINKS = [
  ["capcut_link", "CapCut"], ["canva_link", "Canva"],
  ["chatgpt_link", "ChatGPT"], ["gemini_link", "Gemini"], ["kling_link", "Kling AI"], ["hailuo_link", "Hailuo AI"],
];
export const RESOURCE_TEXTS = [
  ["image_prompt", "Prompt ảnh AI", "Copy Prompt"],
  ["video_prompt", "Prompt video AI", "Copy Prompt"],
  ["script_content", "Kịch bản video", "Copy Kịch bản"],
  ["facebook_caption", "Caption Facebook", "Copy Caption"],
  ["tiktok_caption", "Caption TikTok", "Copy Caption"],
  ["hashtags", "Hashtag", "Copy Hashtag"],
];

// Tài nguyên nhanh: dùng cho thanh "Truy cập nhanh" và tab "📂 Tài nguyên"
// color: nền nút trên thanh truy cập nhanh + icon card
export const QUICK_RESOURCES = [
  { key: "chatgpt_link", label: "ChatGPT", fullLabel: "ChatGPT", icon: Bot, color: "bg-zinc-900 hover:bg-zinc-700", tooltip: "Mở ChatGPT" },
  { key: "gemini_link", label: "Gemini", fullLabel: "Gemini", icon: Sparkles, color: "bg-blue-600 hover:bg-blue-700", tooltip: "Mở Gemini" },
  { key: "kling_link", label: "Kling", fullLabel: "Kling AI", icon: Clapperboard, color: "bg-violet-600 hover:bg-violet-700", tooltip: "Mở Kling AI" },
  { key: "hailuo_link", label: "Hailuo", fullLabel: "Hailuo AI", icon: Video, color: "bg-orange-500 hover:bg-orange-600", tooltip: "Mở Hailuo AI" },
  { key: "capcut_link", label: "CapCut", fullLabel: "CapCut", icon: Scissors, color: "bg-zinc-800 hover:bg-zinc-600", tooltip: "Mở CapCut" },
];

// Tài nguyên dự án: loại file được phép tải lên
export const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime";
export const ACCEPTED_FILE_EXT = ".jpg,.jpeg,.png,.webp,.mp4,.mov";
export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB / file
export const DEFAULT_RESOURCE_FIELDS = [
  ["chatgpt_link", "ChatGPT"],
  ["gemini_link", "Gemini"],
  ["kling_link", "Kling AI"],
  ["hailuo_link", "Hailuo AI"],
  ["capcut_link", "CapCut"],
];
