import React, { useEffect, useState } from "react";
import { Plus, Pencil, KeyRound, Lock, Unlock, Trash2 } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { inputCls, btnPri, btnSec, cardCls, Modal, Field, Confirm, Spinner, ErrorBox, errMsg, showToast } from "../components/ui";

export default function Employees() {
  const { user: me } = useAuth();
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);   // nhân viên đang đổi mật khẩu
  const [lockTarget, setLockTarget] = useState(null); // nhân viên đang chờ xác nhận khóa
  const [delTarget, setDelTarget] = useState(null);   // nhân viên đang chờ xác nhận xóa

  const load = () => api.get("/users").then(r => setList(r.data)).catch(e => setErr(errMsg(e)));
  useEffect(load, []);

  const open = (u) => { setEditing(u || "new"); setF(u ? { ...u } : { name: "", email: "", phone: "", position: "", role: "staff", password: "123456" }); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") await api.post("/users", f);
      else await api.put(`/users/${editing.id}`, f);
      setEditing(null); load();
    } catch (e) { alert(errMsg(e)); } finally { setSaving(false); }
  };

  // 🔒 Khóa tài khoản (cần xác nhận) / 🔓 Mở khóa (không cần xác nhận)
  const onLockClick = (u) => {
    if (u.id === me.id) { showToast("⚠️ Không thể thao tác với tài khoản hiện tại."); return; }
    if (u.status === "active") { setLockTarget(u); return; }
    doToggleLock(u, "active");
  };
  const doToggleLock = async (u, forceStatus) => {
    const ns = forceStatus || (u.status === "active" ? "locked" : "active");
    try {
      await api.put(`/users/${u.id}/lock`, { status: ns });
      showToast(ns === "locked" ? "🔴 Đã khóa tài khoản" : "🟢 Đã mở khóa tài khoản");
      load();
    } catch (e) { alert(errMsg(e)); }
    setLockTarget(null);
  };

  // 🗑️ Xóa nhân viên (cần xác nhận)
  const onDeleteClick = (u) => {
    if (u.id === me.id) { showToast("⚠️ Không thể thao tác với tài khoản hiện tại."); return; }
    setDelTarget(u);
  };
  const doDelete = async () => {
    try { await api.delete(`/users/${delTarget.id}`); showToast("✅ Đã xóa nhân viên"); load(); }
    catch (e) { alert(errMsg(e)); }
    setDelTarget(null);
  };

  if (err) return <ErrorBox msg={err} />;
  if (!list) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button className={btnPri} onClick={() => open(null)}><Plus size={15} /> Thêm nhân viên</button></div>
      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full text-sm min-w-[760px]">
          <thead><tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 font-medium">Nhân viên</th><th className="px-3 py-3 font-medium">Liên hệ</th><th className="px-3 py-3 font-medium">Chức vụ</th><th className="px-3 py-3 font-medium">Vai trò</th><th className="px-3 py-3 font-medium">Trạng thái</th><th className="px-3 py-3 font-medium">Thao tác</th>
          </tr></thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{u.name.split(" ").pop()[0]}</div>
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</span>
                      {u.id === me.id && <span className="ml-1.5 text-[10px] text-zinc-400">(Bạn)</span>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">{u.email}<p className="text-zinc-400">{u.phone}</p></td>
                <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">{u.position || "—"}</td>
                <td className="px-3 py-3 text-xs">{u.role === "admin" ? <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 font-medium">Admin</span> : <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 font-medium">Nhân viên</span>}</td>
                <td className="px-3 py-3 text-xs">{u.status === "active" ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">🟢 Hoạt động</span> : <span className="text-red-500 font-medium">🔴 Đã khóa</span>}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="Sửa" onClick={() => open(u)}><Pencil size={15} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="Đổi mật khẩu" onClick={() => setPwTarget(u)}><KeyRound size={15} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title={u.status === "active" ? "Khóa tài khoản" : "Mở khóa"} onClick={() => onLockClick(u)}>{u.status === "active" ? <Lock size={15} /> : <Unlock size={15} />}</button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500" title="Xóa nhân viên" onClick={() => onDeleteClick(u)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Thêm nhân viên" : "Sửa nhân viên"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Họ tên *"><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Email *"><input className={inputCls} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Số điện thoại"><input className={inputCls} value={f.phone || ""} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Chức vụ"><input className={inputCls} value={f.position || ""} onChange={e => setF({ ...f, position: e.target.value })} placeholder="VD: Editor, Sale..." /></Field>
            <Field label="Vai trò"><select className={inputCls} value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="staff">Nhân viên</option><option value="admin">Admin</option></select></Field>
            {editing === "new" && <Field label="Mật khẩu ban đầu"><input className={inputCls} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></Field>}
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button className={btnSec} onClick={() => setEditing(null)} disabled={saving}>Hủy</button>
            <button className={btnPri} disabled={!f.name?.trim() || !f.email?.trim() || saving} onClick={save}>{saving ? "Đang lưu..." : "Lưu"}</button>
          </div>
        </Modal>
      )}

      {pwTarget && <AdminChangePasswordModal target={pwTarget} onClose={() => setPwTarget(null)} />}

      {lockTarget && (
        <Confirm
          msg={`Bạn có chắc muốn khóa tài khoản "${lockTarget.name}"? Nhân viên sẽ không thể đăng nhập.`}
          onNo={() => setLockTarget(null)}
          onYes={() => doToggleLock(lockTarget, "locked")}
        />
      )}
      {delTarget && (
        <Confirm
          msg={`Xóa nhân viên "${delTarget.name}"? Hành động này không thể hoàn tác.`}
          onNo={() => setDelTarget(null)}
          onYes={doDelete}
        />
      )}
    </div>
  );
}

// Popup Admin đổi mật khẩu cho nhân viên
function AdminChangePasswordModal({ target, onClose }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setErr("");
    if (pass.length < 6) return setErr("Mật khẩu mới phải từ 6 ký tự");
    setSaving(true);
    try {
      await api.put(`/users/${target.id}/reset-password`, { new_password: pass });
      showToast("✅ Đổi mật khẩu thành công");
      onClose();
    } catch (e) { setErr(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <Modal title="Đổi mật khẩu nhân viên" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Tên nhân viên: <b>{target.name}</b></p>
        <Field label="Mật khẩu mới (tối thiểu 6 ký tự)">
          <input type="text" className={inputCls} value={pass} onChange={e => setPass(e.target.value)} autoFocus placeholder="Nhập mật khẩu mới..." />
        </Field>
        {err && <p className="text-xs text-red-500">{err}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className={btnSec} onClick={onClose} disabled={saving}>Hủy</button>
        <button className={btnPri} disabled={!pass || saving} onClick={submit}>{saving ? "Đang lưu..." : "Xác nhận"}</button>
      </div>
    </Modal>
  );
}
