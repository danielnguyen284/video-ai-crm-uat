import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, Clapperboard } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  inputCls, btnPri, btnSec, cardCls, Modal, Field, Empty, Confirm,
  Spinner, ErrorBox, errMsg, StatusDot,
} from "../components/ui";
import { PROJECT_STATUS } from "../utils/constants";
import { money, fmtDate, daysLeft, deadlineBadge } from "../utils/format";
import ProjectDetail from "./ProjectDetail";

export default function Projects() {
  const { isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fAssigned, setFAssigned] = useState("");
  const [fDebt, setFDebt] = useState(""); // "" | "debt" | "paid"
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/projects", {
      params: {
        q: q || undefined,
        status: fStatus || undefined,
        assigned_to: fAssigned || undefined,
      },
    }).then(r => setList(r.data)).catch(e => setErr(errMsg(e)));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, fStatus, fAssigned]);
  useEffect(() => {
    api.get("/customers").then(r => setCustomers(r.data)).catch(() => {});
    api.get("/users").then(r => setUsers(r.data)).catch(() => {});
  }, []);
  useEffect(() => {
    const open = params.get("open");
    if (open) { setDetailId(Number(open)); params.delete("open"); setParams(params, { replace: true }); }
  }, [params]);

  const custName = (id) => customers.find(c => c.id === id)?.name || "—";
  const userName = (id) => users.find(u => u.id === id)?.name || "—";

  const save = async (f) => {
    setSaving(true);
    try {
      if (editing === "new") await api.post("/projects", f);
      else await api.put(`/projects/${editing.id}`, f);
      setEditing(null); load();
    } catch (e) { alert(errMsg(e)); } finally { setSaving(false); }
  };
  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/projects/${del.id}`); setDel(null); load(); }
    catch (e) { alert(errMsg(e)); } finally { setSaving(false); }
  };

  // Lọc công nợ ở phía client (vì còn nợ/đã đủ tính theo remaining trả về sẵn)
  let filtered = list || [];
  if (fDebt === "debt") filtered = filtered.filter(p => Number(p.remaining) > 0 && p.status !== "huy");
  if (fDebt === "paid") filtered = filtered.filter(p => Number(p.remaining) <= 0 || p.status === "huy");

  return (
    <div className="space-y-4">
      {/* Bộ lọc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
        <div className="relative sm:col-span-2 lg:flex-1 lg:min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className={inputCls + " pl-9"} placeholder="Tìm tên dự án, khách hàng..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className={inputCls} value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className={inputCls} value={fAssigned} onChange={e => setFAssigned(e.target.value)}>
          <option value="">Tất cả nhân viên</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className={inputCls} value={fDebt} onChange={e => setFDebt(e.target.value)}>
          <option value="">Tất cả công nợ</option>
          <option value="debt">Còn nợ</option>
          <option value="paid">Đã thanh toán đủ</option>
        </select>
        <button className={btnPri + " sm:col-span-2 lg:w-auto justify-center"} onClick={() => setEditing("new")}><Plus size={15} /> Thêm dự án</button>
      </div>

      {err && <ErrorBox msg={err} />}
      {!list ? <Spinner /> : filtered.length ? (
        <>
          {/* Bảng - desktop / tablet */}
          <div className={`${cardCls} overflow-x-auto hidden sm:block`}>
            <table className="w-full text-sm min-w-[860px]">
              <thead><tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Tên dự án</th>
                <th className="px-3 py-3 font-medium">Khách hàng</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
                <th className="px-3 py-3 font-medium">Giá trị hợp đồng</th>
                <th className="px-3 py-3 font-medium">Đã thanh toán</th>
                <th className="px-3 py-3 font-medium">Còn nợ</th>
                <th className="px-3 py-3 font-medium">Hạn giao</th>
                <th className="px-3 py-3 font-medium">Phụ trách</th>
                <th className="px-3 py-3"></th>
              </tr></thead>
              <tbody>
                {filtered.map(p => {
                  const d = daysLeft(p.deadline);
                  const paid = Math.max(0, Number(p.price) - Number(p.remaining));
                  return (
                    <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3"><button className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 text-left" onClick={() => setDetailId(p.id)}>{p.title}</button></td>
                      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300 text-xs">{p.customer_name || custName(p.customer_id)}</td>
                      <td className="px-3 py-3"><StatusDot status={p.status} map={PROJECT_STATUS} /></td>
                      <td className="px-3 py-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">{money(p.price)}</td>
                      <td className="px-3 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">{money(paid)}</td>
                      <td className={`px-3 py-3 text-xs font-medium ${Number(p.remaining) > 0 ? "text-rose-500" : "text-zinc-400"}`}>{Number(p.remaining) > 0 ? money(p.remaining) : "Đã đủ"}</td>
                      <td className={`px-3 py-3 text-xs ${d !== null && d < 0 && !["hoan_thanh", "huy"].includes(p.status) ? "text-red-500 font-medium" : "text-zinc-500"}`}>
                        <p>{fmtDate(p.deadline)}</p>
                        {(() => { const b = deadlineBadge(p.deadline, p.status); return b ? <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${b.cls}`}>{b.label}</span> : null; })()}
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">{p.assigned_name || userName(p.assigned_to)}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" onClick={() => setEditing(p)}><Pencil size={15} /></button>
                        {isAdmin && <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500" onClick={() => setDel(p)}><Trash2 size={15} /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Thẻ - mobile */}
          <div className="sm:hidden space-y-2">
            {filtered.map(p => {
              const d = daysLeft(p.deadline);
              const paid = Math.max(0, Number(p.price) - Number(p.remaining));
              return (
                <div key={p.id} className={`${cardCls} p-3`} onClick={() => setDetailId(p.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{p.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{p.customer_name || custName(p.customer_id)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" onClick={() => setEditing(p)}><Pencil size={15} /></button>
                      {isAdmin && <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500" onClick={() => setDel(p)}><Trash2 size={15} /></button>}
                    </div>
                  </div>
                  <div className="mt-2"><StatusDot status={p.status} map={PROJECT_STATUS} /></div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div><p className="text-[10px] text-zinc-400">Hợp đồng</p><p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{money(p.price)}</p></div>
                    <div><p className="text-[10px] text-zinc-400">Đã trả</p><p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{money(paid)}</p></div>
                    <div><p className="text-[10px] text-zinc-400">Còn nợ</p><p className={`text-xs font-semibold ${Number(p.remaining) > 0 ? "text-rose-500" : "text-zinc-400"}`}>{Number(p.remaining) > 0 ? money(p.remaining) : "Đã đủ"}</p></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                    <span>👤 {p.assigned_name || userName(p.assigned_to)}</span>
                    <span className={d !== null && d < 0 && !["hoan_thanh", "huy"].includes(p.status) ? "text-red-500 font-medium" : ""}>📅 {fmtDate(p.deadline)}</span>
                  </div>
                  {(() => { const b = deadlineBadge(p.deadline, p.status); return b ? <div className="mt-2"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${b.cls}`}>⚠️ {b.label}</span></div> : null; })()}
                </div>
              );
            })}
          </div>
        </>
      ) : <div className={cardCls}><Empty icon={Clapperboard} text="Không có dự án phù hợp" /></div>}

      {editing && <ProjectModal initial={editing === "new" ? null : editing} customers={customers} users={users} onSave={save} onClose={() => setEditing(null)} saving={saving} />}
      {del && <Confirm msg={`Xóa dự án "${del.title}"? Toàn bộ thanh toán & tài nguyên liên quan sẽ bị xóa.`} onNo={() => setDel(null)} onYes={doDelete} busy={saving} />}
      {detailId && <ProjectDetail id={detailId} isAdmin={isAdmin} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  );
}

function ProjectModal({ initial, customers, users, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { title: "", customer_id: customers[0]?.id || "", description: "", price: "", deposit: "", status: "moi_nhan", start_date: new Date().toISOString().slice(0, 10), deadline: "", assigned_to: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const remaining = Math.max(0, Number(f.price || 0) - Number(f.deposit || 0));
  return (
    <Modal title={initial ? "Sửa dự án" : "Thêm dự án"} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Field label="Tên dự án *"><input className={inputCls} value={f.title} onChange={set("title")} /></Field></div>
        <Field label="Khách hàng *"><select className={inputCls} value={f.customer_id} onChange={set("customer_id")}>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Nhân viên phụ trách"><select className={inputCls} value={f.assigned_to || ""} onChange={set("assigned_to")}><option value="">— Chưa phân công —</option>{users.filter(u => u.status === "active").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Giá trị hợp đồng (₫)"><input type="number" className={inputCls} value={f.price} onChange={set("price")} /></Field>
        <Field label="Tiền cọc (₫)"><input type="number" className={inputCls} value={f.deposit} onChange={set("deposit")} /></Field>
        <Field label="Ngày bắt đầu"><input type="date" className={inputCls} value={(f.start_date || "").slice(0, 10)} onChange={set("start_date")} /></Field>
        <Field label="Hạn bàn giao"><input type="date" className={inputCls} value={(f.deadline || "").slice(0, 10)} onChange={set("deadline")} /></Field>
        <Field label="Trạng thái"><select className={inputCls} value={f.status} onChange={set("status")}>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
        <div className="flex items-end pb-1 text-sm text-zinc-500">Còn lại theo cọc: <b className="ml-1 text-zinc-800 dark:text-zinc-200">{money(remaining)}</b></div>
        <div className="sm:col-span-2"><Field label="Mô tả"><textarea rows={3} className={inputCls} value={f.description || ""} onChange={set("description")} /></Field></div>

        {!initial && (
          <div className="sm:col-span-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 pt-2">
              📂 ChatGPT, Gemini, Kling AI, Hailuo AI, CapCut sẽ tự động điền theo mẫu mặc định (Cài đặt hệ thống).
              Ảnh/video tài nguyên dự án có thể tải lên ngay sau khi tạo, trong tab "📂 Tài nguyên" của dự án.
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className={btnSec} onClick={onClose} disabled={saving}>Hủy</button>
        <button className={btnPri} disabled={!f.title?.trim() || !f.customer_id || saving} onClick={() => onSave(f)}>{saving ? "Đang lưu..." : "Lưu"}</button>
      </div>
    </Modal>
  );
}
