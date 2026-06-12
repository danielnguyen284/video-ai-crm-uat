import React, { useEffect, useRef, useState } from "react";
import { Link2, Plus, Trash2, FileText, Printer, Copy, Upload, Image as ImageIcon, Film, Download, Eye } from "lucide-react";
import api from "../api/client";
import {
  inputCls, btnPri, btnSec, btnDanger, Modal, Field, Spinner, ErrorBox, errMsg, StatusDot, CopyButton, showToast,
} from "../components/ui";
import { PROJECT_STATUS, PAYMENT_METHODS, RESOURCE_LINKS, RESOURCE_TEXTS, QUICK_RESOURCES, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "../utils/constants";
import { money, fmtDate, downloadFile, deadlineBadge, formatBytes } from "../utils/format";

const QR_MAP = Object.fromEntries(QUICK_RESOURCES.map(r => [r.key, r]));

// Thanh "Truy cập nhanh": mở tab mới hoặc copy link tài nguyên dự án chỉ với 1 click
function QuickAccessBar({ rf }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {QUICK_RESOURCES.map(item => {
        const url = rf?.[item.key];
        const Icon = item.icon;
        return (
          <div key={item.key} className="inline-flex rounded-lg overflow-hidden shadow-sm" title={item.tooltip}>
            <button type="button" disabled={!url} onClick={() => url && window.open(url, "_blank")}
              className={`flex items-center gap-1.5 pl-2.5 pr-2 py-2 text-xs font-medium text-white ${item.color} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}>
              <Icon size={14} /> {item.label}
              <span className="text-[10px]">{url ? "🟢" : "⚪"}</span>
            </button>
            <button type="button" title="Sao chép link"
              onClick={async () => {
                if (!url) { showToast("Chưa có link để sao chép"); return; }
                try { await navigator.clipboard.writeText(url); showToast("✅ Đã sao chép link"); }
                catch { showToast("Không thể sao chép"); }
              }}
              className={`px-2 py-2 text-white ${item.color} border-l border-white/20`}>
              <Copy size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Card hiển thị 1 tài nguyên: tên, domain, [Mở] [Sao chép] + ô nhập link
function ResourceCard({ item, value, onChange }) {
  const Icon = item.icon;
  let domain = "";
  try { domain = value ? new URL(value).hostname.replace(/^www\./, "") : ""; } catch { domain = value || ""; }
  return (
    <div className={cardClsLocal + " p-3 space-y-2"}>
      <div className="flex items-center gap-2">
        <div className={`w-9 h-9 rounded-lg ${item.color.split(" ")[0]} flex items-center justify-center text-white shrink-0`}><Icon size={16} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.fullLabel}</p>
          <p className="text-xs text-zinc-400 truncate">{domain || "Chưa cấu hình"} {value ? "🟢" : "⚪"}</p>
        </div>
      </div>
      <input className={inputCls + " text-xs"} placeholder="https://..." value={value || ""} onChange={onChange} />
      <div className="flex gap-2">
        <button type="button" className={btnSec + " flex-1 justify-center"} disabled={!value} onClick={() => value && window.open(value, "_blank")}>Mở</button>
        <CopyButton text={value} label="Sao chép" successText="✅ Đã sao chép" />
      </div>
    </div>
  );
}
const cardClsLocal = "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm";

// "Tài nguyên dự án": upload / xem / tải xuống / xóa ảnh & video của dự án
function ProjectFiles({ projectId }) {
  const [files, setFiles] = useState(null);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const token = localStorage.getItem("crm_token") || "";
  const baseURL = (api.defaults.baseURL || "").replace(/\/$/, "");
  const fileUrl = (fileId, action) => `${baseURL}/projects/${projectId}/files/${fileId}/${action}?token=${encodeURIComponent(token)}`;

  const load = () => api.get(`/projects/${projectId}/files`).then(r => setFiles(r.data)).catch(e => setErr(errMsg(e)));
  useEffect(() => { load(); }, [projectId]);

  const onPick = async (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = "";
    if (!list.length) return;
    const tooBig = list.find(f => f.size > MAX_FILE_SIZE);
    if (tooBig) return alert(`File "${tooBig.name}" vượt quá 200MB.`);
    const fd = new FormData();
    list.forEach(f => fd.append("files", f));
    setUploading(true);
    try {
      await api.post(`/projects/${projectId}/files`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("✅ Tải lên thành công");
      load();
    } catch (e) { alert(errMsg(e)); } finally { setUploading(false); }
  };

  const onDelete = async (f) => {
    if (!confirm(`Xóa file "${f.original_name}"?`)) return;
    try { await api.delete(`/projects/${projectId}/files/${f.id}`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  return (
    <div className={`${cardClsLocal} p-3 space-y-3`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tài nguyên dự án (ảnh / video)</h4>
          <p className="text-xs text-zinc-400">Cho phép: ảnh JPG, PNG, WEBP và video MP4, MOV — tối đa 200MB/file.</p>
        </div>
        <label className={btnPri + " cursor-pointer"}>
          <Upload size={15} /> {uploading ? "Đang tải lên..." : "Tải lên file"}
          <input ref={inputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={onPick} disabled={uploading} />
        </label>
      </div>

      {err && <ErrorBox msg={err} />}
      {!files ? <Spinner /> : files.length ? (
        <div className="space-y-1.5">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${f.file_type === "video" ? "bg-red-500" : "bg-emerald-500"}`}>
                {f.file_type === "video" ? <Film size={15} /> : <ImageIcon size={15} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{f.original_name}</p>
                <p className="text-xs text-zinc-400">{formatBytes(f.size)} · Tải lên {fmtDate(f.created_at)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <a href={fileUrl(f.id, "view")} target="_blank" rel="noreferrer" title="Xem" className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"><Eye size={15} /></a>
                <a href={fileUrl(f.id, "download")} title="Tải xuống" className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"><Download size={15} /></a>
                <button title="Xóa" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500" onClick={() => onDelete(f)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-zinc-400 text-center py-4">Chưa có file nào được tải lên.</p>}
    </div>
  );
}

export default function ProjectDetail({ id, isAdmin, onClose, onChanged }) {
  const [tab, setTab] = useState("info");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [rf, setRf] = useState(null);
  const [resSaving, setResSaving] = useState(false);
  const [payForm, setPayForm] = useState(null);
  const [paySaving, setPaySaving] = useState(false);

  const load = () => {
    api.get(`/projects/${id}`).then(r => { setData(r.data); setRf(r.data.resources || { project_id: id }); })
      .catch(e => setErr(errMsg(e)));
  };
  useEffect(() => { load(); }, [id]);

  if (err) return <Modal title="Lỗi" onClose={onClose}><ErrorBox msg={err} /></Modal>;
  if (!data) return <Modal title="Đang tải..." onClose={onClose}><Spinner /></Modal>;

  const paid = (data.payments || []).reduce((s, t) => s + Number(t.amount || 0), 0);
  const remaining = Math.max(0, Number(data.price || 0) - paid);

  const saveRes = async () => {
    setResSaving(true);
    try { await api.put(`/projects/${id}/resources`, rf); load(); }
    catch (e) { alert(errMsg(e)); } finally { setResSaving(false); }
  };
  const addPay = async () => {
    setPaySaving(true);
    try {
      await api.post("/payments", { project_id: id, amount: Number(payForm.amount || 0), payment_method: payForm.payment_method, note: payForm.note, payment_date: payForm.payment_date });
      setPayForm(null); load(); onChanged?.();
    } catch (e) { alert(errMsg(e)); } finally { setPaySaving(false); }
  };
  const delPay = async (t) => {
    if (!confirm(`Xóa giao dịch ${money(t.amount)}?`)) return;
    try { await api.delete(`/payments/${t.id}`); load(); onChanged?.(); }
    catch (e) { alert(errMsg(e)); }
  };

  const exportQuote = (kind) => {
    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${kind} - ${data.title}</title>
<style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#18181b;line-height:1.6}h1{font-size:22px;border-bottom:3px solid #2563eb;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #d4d4d8;padding:8px 10px;text-align:left;font-size:14px}th{background:#eff6ff}.sign{display:flex;justify-content:space-between;margin-top:60px;text-align:center}.muted{color:#71717a;font-size:13px}@media print{body{margin:10mm}}</style></head><body>
<h1>${kind.toUpperCase()} DỊCH VỤ VIDEO AI</h1>
<p class="muted">Ngày lập: ${new Date().toLocaleDateString("vi-VN")}</p>
<table><tr><th colspan="2">Thông tin khách hàng</th></tr>
<tr><td>Khách hàng</td><td>${data.customer_name || ""}</td></tr></table>
<table><tr><th colspan="2">Nội dung dự án</th></tr>
<tr><td>Tên dự án</td><td>${data.title}</td></tr><tr><td>Mô tả</td><td>${data.description || ""}</td></tr>
<tr><td>Giá trị hợp đồng</td><td><b>${money(data.price)}</b></td></tr><tr><td>Tiền cọc</td><td>${money(data.deposit)}</td></tr>
<tr><td>Đã thanh toán</td><td>${money(paid)}</td></tr><tr><td>Còn lại</td><td>${money(remaining)}</td></tr>
<tr><td>Hạn bàn giao</td><td>${fmtDate(data.deadline)}</td></tr></table>
<div class="sign"><div><b>ĐẠI DIỆN BÊN A</b><p class="muted">(Ký, ghi rõ họ tên)</p></div><div><b>ĐẠI DIỆN BÊN B</b><p class="muted">(Ký, ghi rõ họ tên)</p></div></div>
<script>window.print()</script></body></html>`;
    downloadFile(`${kind === "Báo giá" ? "bao-gia" : "hop-dong"}-${data.title.slice(0, 30)}.html`, html, "text/html;charset=utf-8");
  };

  const TabBtn = ({ tid, children }) => <button onClick={() => setTab(tid)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === tid ? "bg-blue-600 text-white" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>{children}</button>;

  return (
    <Modal title={data.title} onClose={onClose} wide>
      <QuickAccessBar rf={rf} />
      <div className="flex flex-wrap gap-1.5 mb-4">
        <TabBtn tid="info">Thông tin</TabBtn><TabBtn tid="resources">📂 Tài nguyên</TabBtn><TabBtn tid="script">Kịch bản</TabBtn><TabBtn tid="pay">Thanh toán</TabBtn>
      </div>

      {tab === "info" && (
        <div className="space-y-3 text-sm">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            <p className="text-zinc-600 dark:text-zinc-300"><span className="text-zinc-400 text-xs">Khách hàng: </span>{data.customer_name}</p>
            <p className="text-zinc-600 dark:text-zinc-300"><span className="text-zinc-400 text-xs">Phụ trách: </span>{data.assigned_name || "—"}</p>
            <p className="text-zinc-600 dark:text-zinc-300"><span className="text-zinc-400 text-xs">Bắt đầu: </span>{fmtDate(data.start_date)}</p>
            <p className="text-zinc-600 dark:text-zinc-300"><span className="text-zinc-400 text-xs">Hạn bàn giao: </span>{fmtDate(data.deadline)}
              {(() => { const b = deadlineBadge(data.deadline, data.status); return b ? <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${b.cls}`}>{b.label}</span> : null; })()}
            </p>
            <p><StatusDot status={data.status} map={PROJECT_STATUS} /></p>
          </div>
          {data.description && <p className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3 text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{data.description}</p>}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Hợp đồng", data.price, "text-zinc-900 dark:text-zinc-100"], ["Đã thanh toán", paid, "text-emerald-600 dark:text-emerald-400"], ["Còn nợ", remaining, remaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-500"]].map(([l, v, c]) => (
              <div key={l} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-xs text-zinc-400">{l}</p><p className={`font-bold text-sm ${c}`}>{money(v)}</p></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button className={btnSec} onClick={() => exportQuote("Báo giá")}><Printer size={15} /> Xuất báo giá (PDF)</button>
            <button className={btnSec} onClick={() => exportQuote("Hợp đồng")}><FileText size={15} /> Xuất hợp đồng (PDF)</button>
          </div>
          <p className="text-xs text-zinc-400">File tải về sẽ tự mở hộp thoại in — chọn "Save as PDF".</p>
        </div>
      )}

      {tab === "resources" && (
        <div className="space-y-3">
          <ProjectFiles projectId={id} />
          <div className="grid sm:grid-cols-2 gap-3">
            {RESOURCE_LINKS.map(([k, label]) => {
              const item = QR_MAP[k] || { fullLabel: label, icon: Link2, color: "bg-zinc-500 hover:bg-zinc-600" };
              return <ResourceCard key={k} item={item} value={rf?.[k]} onChange={e => setRf({ ...rf, [k]: e.target.value })} />;
            })}
          </div>
          <div className="flex justify-end"><button className={btnPri} disabled={resSaving} onClick={saveRes}>{resSaving ? "Đang lưu..." : "Lưu tài nguyên"}</button></div>
        </div>
      )}

      {tab === "script" && (
        <div className="space-y-3">
          {RESOURCE_TEXTS.map(([k, label, copyLabel]) => (
            <Field key={k} label={label} action={<CopyButton text={rf?.[k] || ""} label={copyLabel} />}>
              <textarea rows={k === "script_content" ? 4 : 2} className={inputCls} value={rf?.[k] || ""} onChange={e => setRf({ ...rf, [k]: e.target.value })} />
            </Field>
          ))}
          <div className="flex justify-end"><button className={btnPri} disabled={resSaving} onClick={saveRes}>{resSaving ? "Đang lưu..." : "Lưu kịch bản"}</button></div>
        </div>
      )}

      {tab === "pay" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Hợp đồng", data.price], ["Đã thanh toán", paid], ["Còn nợ", remaining]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-xs text-zinc-400">{l}</p><p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{money(v)}</p></div>
            ))}
          </div>
          {isAdmin && !payForm && <button className={btnPri} onClick={() => setPayForm({ amount: "", payment_method: "Chuyển khoản", note: "", payment_date: new Date().toISOString().slice(0, 10) })}><Plus size={15} /> Ghi nhận thanh toán</button>}
          {payForm && (
            <div className="grid sm:grid-cols-2 gap-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
              <Field label="Số tiền (₫)"><input type="number" className={inputCls} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} /></Field>
              <Field label="Phương thức"><select className={inputCls} value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Ngày thanh toán"><input type="date" className={inputCls} value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} /></Field>
              <Field label="Ghi chú"><input className={inputCls} value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} /></Field>
              <div className="sm:col-span-2 flex justify-end gap-2"><button className={btnSec} onClick={() => setPayForm(null)} disabled={paySaving}>Hủy</button><button className={btnPri} disabled={!Number(payForm.amount) || paySaving} onClick={addPay}>{paySaving ? "Đang lưu..." : "Lưu"}</button></div>
            </div>
          )}
          <div className="space-y-1.5">
            {(data.payments || []).map(t => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 text-sm">
                <div><p className="font-medium text-zinc-800 dark:text-zinc-200">{money(t.amount)} <span className="text-xs text-zinc-400 font-normal">· {t.payment_method}</span></p><p className="text-xs text-zinc-400">{fmtDate(t.payment_date)} {t.note && "· " + t.note} · Mã GD: #{t.id}</p></div>
                {isAdmin && <button className={btnDanger} onClick={() => delPay(t)}><Trash2 size={14} /></button>}
              </div>
            ))}
            {!(data.payments || []).length && <p className="text-xs text-zinc-400 text-center py-3">Chưa có giao dịch.</p>}
          </div>
        </div>
      )}
    </Modal>
  );
}
