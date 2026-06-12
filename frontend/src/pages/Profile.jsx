import React, { useState } from "react";
import { User, KeyRound, Save } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { inputCls, btnPri, btnSec, cardCls, Field, Modal, errMsg, showToast } from "../components/ui";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, phone: user.phone || "", position: user.position || "" });
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const save = async () => {
    if (!f.name.trim()) return;
    setSaving(true);
    try {
      const r = await api.put("/auth/me", f);
      setUser(r.data.user);
      localStorage.setItem("crm_user", JSON.stringify(r.data.user));
      showToast("✅ Đã lưu thông tin");
    } catch (e) { alert(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className={`${cardCls} p-4`}>
        <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2"><User size={16} /> Thông tin cá nhân</h3>
        <p className="text-xs text-zinc-500 mb-4">
          {user.role === "admin" ? "Bạn có thể cập nhật thông tin cá nhân của mình." : "Bạn chỉ có thể xem và sửa thông tin cá nhân của chính mình."}
        </p>
        <div className="space-y-3">
          <Field label="Họ tên *"><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email (không thể thay đổi)"><input className={inputCls + " opacity-60"} value={user.email} disabled /></Field>
          <Field label="Số điện thoại"><input className={inputCls} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Chức vụ"><input className={inputCls} value={f.position} onChange={e => setF({ ...f, position: e.target.value })} placeholder="VD: Editor, Sale, Quản trị viên..." /></Field>
          <Field label="Vai trò (không thể thay đổi)"><input className={inputCls + " opacity-60"} value={user.role === "admin" ? "Admin" : "Nhân viên"} disabled /></Field>
        </div>
        <div className="flex justify-end mt-4">
          <button className={btnPri} disabled={!f.name.trim() || saving} onClick={save}><Save size={15} /> {saving ? "Đang lưu..." : "Lưu thông tin"}</button>
        </div>
      </div>

      <div className={`${cardCls} p-4`}>
        <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2"><KeyRound size={16} /> Bảo mật</h3>
        <p className="text-xs text-zinc-500 mb-4">Chỉ bạn mới đổi được mật khẩu của chính mình — cần nhập đúng mật khẩu hiện tại.</p>
        <button className={btnSec} onClick={() => setPwOpen(true)}><KeyRound size={15} /> Đổi mật khẩu</button>
      </div>

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

// Đổi mật khẩu của chính mình (cần mật khẩu cũ)
function ChangePasswordModal({ onClose }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setErr("");
    if (newPass.length < 6) return setErr("Mật khẩu mới phải từ 6 ký tự");
    if (newPass !== confirm) return setErr("Mật khẩu xác nhận không khớp");
    setSaving(true);
    try {
      await api.put("/auth/change-password", { old_password: oldPass, new_password: newPass });
      showToast("✅ Đổi mật khẩu thành công");
      onClose();
    } catch (e) { setErr(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <Modal title="Đổi mật khẩu" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Mật khẩu hiện tại"><input type="password" className={inputCls} value={oldPass} onChange={e => setOldPass(e.target.value)} /></Field>
        <Field label="Mật khẩu mới (tối thiểu 6 ký tự)"><input type="password" className={inputCls} value={newPass} onChange={e => setNewPass(e.target.value)} /></Field>
        <Field label="Xác nhận mật khẩu mới"><input type="password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} /></Field>
        {err && <p className="text-xs text-red-500">{err}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className={btnSec} onClick={onClose} disabled={saving}>Hủy</button>
        <button className={btnPri} disabled={!oldPass || !newPass || saving} onClick={submit}>{saving ? "Đang lưu..." : "Đổi mật khẩu"}</button>
      </div>
    </Modal>
  );
}
