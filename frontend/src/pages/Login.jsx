import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clapperboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { inputCls, btnPri, cardCls, errMsg } from "../components/ui";
import { Field } from "../components/ui";

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@crm.vn");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) { nav("/", { replace: true }); return null; }

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email.trim(), pass);
      nav("/", { replace: true });
    } catch (e) {
      setErr(errMsg(e));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950 p-4">
      <form onSubmit={submit} className={`${cardCls} w-full max-w-sm p-7`}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white"><Clapperboard size={20} /></div>
          <div>
            <h1 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">Video AI CRM</h1>
            <p className="text-xs text-zinc-500">Quản lý khách hàng & dự án video AI</p>
          </div>
        </div>
        <div className="space-y-3 mt-6">
          <Field label="Email"><input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} autoFocus /></Field>
          <Field label="Mật khẩu"><input type="password" className={inputCls} value={pass} onChange={e => setPass(e.target.value)} /></Field>
          {err && <p className="text-xs text-red-500">{err}</p>}
          <button className={btnPri + " w-full justify-center"} disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
        </div>
        <div className="mt-5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3 space-y-1">
          <p className="font-medium text-zinc-600 dark:text-zinc-300">Tài khoản mặc định sau khi seed:</p>
          <p>Admin: <b>admin@crm.vn</b> / admin123</p>
          <p>Nhân viên: <b>nhanvien@crm.vn</b> / 123456</p>
        </div>
      </form>
    </div>
  );
}
