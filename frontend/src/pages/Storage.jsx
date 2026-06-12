import React, { useEffect, useState } from "react";
import { HardDrive, Trash2, AlertTriangle, Image as ImageIcon, Film } from "lucide-react";
import api from "../api/client";
import { inputCls, btnPri, btnSec, cardCls, Empty, Confirm, Spinner, ErrorBox, errMsg, showToast } from "../components/ui";
import { formatBytes, fmtDate } from "../utils/format";

export default function Storage() {
  const [overview, setOverview] = useState(null);
  const [files, setFiles] = useState(null);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState([]);
  const [err, setErr] = useState("");
  const [oldFiles, setOldFiles] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { msg, ids }

  const loadOverview = () => api.get("/storage/overview").then(r => setOverview(r.data)).catch(e => setErr(errMsg(e)));
  const loadFiles = () => api.get("/storage/files", { params: { sort } }).then(r => { setFiles(r.data); setSelected([]); }).catch(e => setErr(errMsg(e)));
  const loadOld = () => api.get("/storage/old-files", { params: { days: 90 } }).then(r => setOldFiles(r.data)).catch(() => {});

  useEffect(() => { loadOverview(); loadOld(); }, []);
  useEffect(() => { loadFiles(); }, [sort]);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === files.length ? [] : files.map(f => f.id));

  const doDelete = async (ids) => {
    try {
      const r = await api.post("/storage/delete", { ids });
      showToast(`✅ Đã xóa ${r.data.count} file, giải phóng ${formatBytes(r.data.freed)}`);
      setConfirmAction(null);
      loadOverview(); loadFiles(); loadOld();
    } catch (e) { alert(errMsg(e)); }
  };

  if (err) return <ErrorBox msg={err} />;
  if (!overview || !files) return <Spinner />;

  const usedPct = overview.total ? Math.min(100, (overview.used / overview.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Tổng quan dung lượng */}
      <div className={`${cardCls} p-4`}>
        <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2"><HardDrive size={16} /> Dung lượng lưu trữ</h3>
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-xs text-zinc-400">Tổng dung lượng</p><p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatBytes(overview.total)}</p></div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-xs text-zinc-400">Đã sử dụng</p><p className="font-bold text-sm text-blue-600 dark:text-blue-400">{formatBytes(overview.used)}</p></div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-xs text-zinc-400">Còn trống</p><p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{formatBytes(overview.free)}</p></div>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className={`h-full rounded-full ${usedPct > 90 ? "bg-red-500" : usedPct > 70 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${usedPct}%` }} />
        </div>
        <p className="text-xs text-zinc-400 mt-1">{overview.fileCount} file · Đã dùng {usedPct.toFixed(1)}%</p>
      </div>

      {/* Đề xuất xóa file cũ hơn 90 ngày */}
      {oldFiles && oldFiles.files.length > 0 && (
        <div className={`${cardCls} p-4`}>
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500" /> Đề xuất dọn dẹp</h3>
          <p className="text-xs text-zinc-500 mb-3">
            Có <b>{oldFiles.files.length} file</b> được tải lên hơn <b>{oldFiles.days} ngày</b> trước, tổng dung lượng <b>{formatBytes(oldFiles.totalSize)}</b> có thể giải phóng.
            Hệ thống <b>không tự động xóa</b> — bạn cần xác nhận trước khi xóa.
          </p>
          <button className={btnSec}
            onClick={() => setConfirmAction({
              msg: `Xóa ${oldFiles.files.length} file cũ hơn ${oldFiles.days} ngày, giải phóng ${formatBytes(oldFiles.totalSize)}? Hành động này không thể hoàn tác.`,
              ids: oldFiles.files.map(f => f.id),
            })}>
            <Trash2 size={15} /> Xóa các file cũ hơn {oldFiles.days} ngày ({formatBytes(oldFiles.totalSize)})
          </button>
        </div>
      )}

      {/* Danh sách file */}
      <div className={`${cardCls} overflow-x-auto`}>
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2 flex-wrap">
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Danh sách file ({files.length})</h3>
          <div className="flex items-center gap-2">
            <select className={inputCls + " w-auto"} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="largest">Nặng nhất</option>
            </select>
            {selected.length > 0 && (
              <button className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium inline-flex items-center gap-1.5"
                onClick={() => setConfirmAction({ msg: `Xóa ${selected.length} file đã chọn? Hành động này không thể hoàn tác.`, ids: selected })}>
                <Trash2 size={15} /> Xóa đã chọn ({selected.length})
              </button>
            )}
          </div>
        </div>
        {files.length ? (
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 font-medium w-8"><input type="checkbox" checked={selected.length === files.length} onChange={toggleAll} /></th>
              <th className="px-3 py-3 font-medium">Tên file</th>
              <th className="px-3 py-3 font-medium">Dự án</th>
              <th className="px-3 py-3 font-medium">Dung lượng</th>
              <th className="px-3 py-3 font-medium">Ngày tải</th>
            </tr></thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id} className="border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${f.file_type === "video" ? "bg-red-500" : "bg-emerald-500"}`}>
                        {f.file_type === "video" ? <Film size={13} /> : <ImageIcon size={13} />}
                      </div>
                      <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">{f.original_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">{f.project_title}</td>
                  <td className="px-3 py-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">{formatBytes(f.size)}</td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{fmtDate(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon={HardDrive} text="Chưa có file tài nguyên nào" />}
      </div>

      {confirmAction && (
        <Confirm msg={confirmAction.msg} onNo={() => setConfirmAction(null)} onYes={() => doDelete(confirmAction.ids)} />
      )}
    </div>
  );
}
