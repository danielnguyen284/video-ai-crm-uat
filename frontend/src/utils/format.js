export const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " ₫";
export const fmtDate = (s) => { if (!s) return "—"; const d = new Date(s); return isNaN(d) ? "—" : d.toLocaleDateString("vi-VN"); };
export const fmtTime = (s) => { const d = new Date(s); return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); };
export const daysLeft = (s) => { if (!s) return null; return Math.ceil((new Date(s) - new Date()) / 86400000); };

// Badge cảnh báo hạn giao: ≤3 ngày = vàng, ≤1 ngày = đỏ, quá hạn = đỏ đậm
export function deadlineBadge(deadline, status) {
  if (["hoan_thanh", "huy"].includes(status)) return null;
  const d = daysLeft(deadline);
  if (d === null) return null;
  if (d < 0) return { label: `Quá hạn ${-d} ngày`, cls: "bg-red-700 text-white", days: d };
  if (d <= 1) return { label: d === 0 ? "Còn hôm nay" : "Còn 1 ngày", cls: "bg-red-500 text-white", days: d };
  if (d <= 3) return { label: `Còn ${d} ngày`, cls: "bg-amber-400 text-zinc-900", days: d };
  return null;
}

export function downloadFile(name, content, type) {
  const blob = new Blob(["\uFEFF" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const csv = (rows) => rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

// Định dạng kích thước file (bytes -> KB/MB/GB)
export function formatBytes(bytes, decimals = 1) {
  const b = Number(bytes) || 0;
  if (b === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}
