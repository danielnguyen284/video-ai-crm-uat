import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, Plus, Pencil, Trash2, Eye, Phone, Mail, Users } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  inputCls, btnPri, btnSec, cardCls, Badge, Modal, Field, Empty, Confirm,
  Spinner, ErrorBox, errMsg, StatusDot,
} from "../components/ui";
import { CUSTOMER_STATUS, SOURCES, PROJECT_STATUS } from "../utils/constants";
import { downloadFile, csv } from "../utils/format";

export default function Customers() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const [list, setList] = useState(null);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSource, setFSource] = useState("");
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/customers", { params: { q: q || undefined, status: fStatus || undefined, source: fSource || undefined } })
      .then(r => setList(r.data)).catch(e => setErr(errMsg(e)));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, fStatus, fSource]);
  useEffect(() => { api.get("/users").then(r => setUsers(r.data)).catch(() => {}); }, []);

  const userName = (id) => users.find(u => u.id === id)?.name || "—";

  const save = async (f) => {
    setSaving(true);
    try {
      if (editing === "new") await api.post("/customers", f);
      else await api.put(`/customers/${editing.id}`, f);
      setEditing(null); load();
    } catch (e) { alert(errMsg(e)); } finally { setSaving(false); }
  };
  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/customers/${del.id}`); setDel(null); load(); }
    catch (e) { alert(errMsg(e)); } finally { setSaving(false); }
  };
  const openView = async (c) => {
    try { const r = await api.get(`/customers/${c.id}`); setViewing(r.data); }
    catch (e) { alert(errMsg(e)); }
  };
  const exportCsv = () => {
    const rows = [["Họ tên", "SĐT", "Facebook", "Zalo", "Email", "Địa chỉ", "Ngành nghề", "Nguồn", "Trạng thái", "Phụ trách", "Ghi chú"]];
    (list || []).forEach(c => rows.push([c.name, c.phone, c.facebook, c.zalo, c.email, c.address, c.industry, c.source, CUSTOMER_STATUS[c.status]?.label, c.assigned_name || "", c.note]));
    downloadFile("khach-hang.csv", csv(rows), "text/csv;charset=utf-8");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className={inputCls + " pl-9"} placeholder="Tìm tên, SĐT, email..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className={inputCls + " w-auto"} value={fStatus} onChange={e => setFStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(CUSTOMER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select className={inputCls + " w-auto"} value={fSource} onChange={e => setFSource(e.target.value)}><option value="">Tất cả nguồn</option>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
        <button className={btnSec} onClick={exportCsv}><Download size={15} /> Excel</button>
        <button className={btnPri} onClick={() => setEditing("new")}><Plus size={15} /> Thêm khách</button>
      </div>

      {err && <ErrorBox msg={err} />}
      {!list ? <Spinner /> : (
        <div className={`${cardCls} overflow-x-auto`}>
          {list.length ? (
            <table className="w-full text-sm min-w-[760px]">
              <thead><tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Khách hàng</th><th className="px-3 py-3 font-medium">Liên hệ</th><th className="px-3 py-3 font-medium">Ngành / Nguồn</th><th className="px-3 py-3 font-medium">Trạng thái</th><th className="px-3 py-3 font-medium">Phụ trách</th><th className="px-3 py-3"></th>
              </tr></thead>
              <tbody>
                {list.map(c => (
                  <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <button className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 text-left" onClick={() => openView(c)}>{c.name}</button>
                      <p className="text-xs text-zinc-400">{c.address || ""}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300"><p className="flex items-center gap-1 text-xs"><Phone size={11} />{c.phone}</p>{c.email && <p className="flex items-center gap-1 text-xs mt-0.5"><Mail size={11} />{c.email}</p>}</td>
                    <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">{c.industry || "—"}<p className="text-zinc-400 mt-0.5">{c.source}</p></td>
                    <td className="px-3 py-3"><Badge map={CUSTOMER_STATUS} value={c.status} /></td>
                    <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">{c.assigned_name || "—"}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="Xem" onClick={() => openView(c)}><Eye size={15} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="Sửa" onClick={() => setEditing(c)}><Pencil size={15} /></button>
                      {isAdmin && <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500" title="Xóa" onClick={() => setDel(c)}><Trash2 size={15} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon={Users} text="Không có khách hàng phù hợp" />}
        </div>
      )}

      {editing && <CustomerModal initial={editing === "new" ? null : editing} users={users} onSave={save} onClose={() => setEditing(null)} saving={saving} />}
      {del && <Confirm msg={`Xóa khách hàng "${del.name}"? Hành động này không thể hoàn tác.`} onNo={() => setDel(null)} onYes={doDelete} busy={saving} />}
      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)} wide>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[["SĐT", viewing.phone], ["Email", viewing.email], ["Facebook", viewing.facebook], ["Zalo", viewing.zalo], ["Địa chỉ", viewing.address], ["Ngành nghề", viewing.industry], ["Nguồn", viewing.source]].map(([k, v]) => (
              <p key={k} className="text-zinc-600 dark:text-zinc-300"><span className="text-zinc-400 text-xs">{k}: </span>{v || "—"}</p>
            ))}
            <p className="sm:col-span-2"><Badge map={CUSTOMER_STATUS} value={viewing.status} /></p>
            {viewing.note && <p className="sm:col-span-2 text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3 text-xs whitespace-pre-wrap">{viewing.note}</p>}
          </div>
          <h4 className="font-semibold text-sm mt-4 mb-2 text-zinc-800 dark:text-zinc-200">Dự án của khách</h4>
          <div className="space-y-1.5">
            {(viewing.projects || []).map(p => (
              <button key={p.id} onClick={() => { setViewing(null); nav(`/projects?open=${p.id}`); }} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-sm">
                <span className="text-zinc-800 dark:text-zinc-200 truncate">{p.title}</span><StatusDot status={p.status} map={PROJECT_STATUS} />
              </button>
            ))}
            {!(viewing.projects || []).length && <p className="text-xs text-zinc-400">Chưa có dự án.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function CustomerModal({ initial, users, onSave, onClose, saving }) {
  const [f, setF] = useState(initial || { name: "", phone: "", facebook: "", zalo: "", email: "", address: "", industry: "", source: "Facebook", status: "tiem_nang", note: "", assigned_to: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Sửa khách hàng" : "Thêm khách hàng"} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Họ tên *"><input className={inputCls} value={f.name} onChange={set("name")} /></Field>
        <Field label="Số điện thoại *"><input className={inputCls} value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Facebook"><input className={inputCls} value={f.facebook || ""} onChange={set("facebook")} /></Field>
        <Field label="Zalo"><input className={inputCls} value={f.zalo || ""} onChange={set("zalo")} /></Field>
        <Field label="Email"><input className={inputCls} value={f.email || ""} onChange={set("email")} /></Field>
        <Field label="Địa chỉ"><input className={inputCls} value={f.address || ""} onChange={set("address")} /></Field>
        <Field label="Ngành nghề"><input className={inputCls} value={f.industry || ""} onChange={set("industry")} placeholder="VD: Nhà hàng, Spa..." /></Field>
        <Field label="Nguồn khách hàng"><select className={inputCls} value={f.source} onChange={set("source")}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Trạng thái"><select className={inputCls} value={f.status} onChange={set("status")}>{Object.entries(CUSTOMER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
        <Field label="Nhân viên phụ trách"><select className={inputCls} value={f.assigned_to || ""} onChange={set("assigned_to")}><option value="">— Chưa phân công —</option>{users.filter(u => u.status === "active").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="Ghi chú chăm sóc"><textarea rows={3} className={inputCls} value={f.note || ""} onChange={set("note")} /></Field></div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className={btnSec} onClick={onClose} disabled={saving}>Hủy</button>
        <button className={btnPri} disabled={!f.name?.trim() || !f.phone?.trim() || saving} onClick={() => onSave(f)}>{saving ? "Đang lưu..." : "Lưu"}</button>
      </div>
    </Modal>
  );
}
