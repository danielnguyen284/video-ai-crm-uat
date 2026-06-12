import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Clapperboard, Wallet, UserCog, History,
  Search, Bell, LogOut, Menu, Clock, CircleDollarSign, KeyRound, Settings, User, HardDrive,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { cardCls, inputCls, Modal, Field, btnPri, btnSec, errMsg, ToastHost } from "./ui";

const NAV = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/customers", label: "Khách hàng", icon: Users },
  { to: "/projects", label: "Dự án Video AI", icon: Clapperboard },
  { to: "/payments", label: "Thanh toán & Công nợ", icon: Wallet },
  { to: "/profile", label: "Hồ sơ cá nhân", icon: User },
  { to: "/employees", label: "Nhân viên", icon: UserCog, admin: true },
  { to: "/logs", label: "Lịch sử hoạt động", icon: History, admin: true },
  { to: "/settings", label: "Cài đặt hệ thống", icon: Settings, admin: true },
  { to: "/storage", label: "Quản lý dung lượng", icon: HardDrive, admin: true },
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const nav = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);
  const [gq, setGq] = useState("");
  const [results, setResults] = useState(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState({ deadlines: [], debts: [] });
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = () => api.get("/notifications").then(r => !stop && setNotifs(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  useEffect(() => {
    const q = gq.trim();
    if (!q) { setResults(null); return; }
    const t = setTimeout(() => {
      api.get("/search", { params: { q } }).then(r => setResults(r.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [gq]);

  const totalNotifs = notifs.deadlines.length + notifs.debts.length;
  const visibleNav = NAV.filter(n => !n.admin || isAdmin);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform lg:translate-x-0 ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Clapperboard size={16} /></div>
          <div><p className="font-bold text-sm leading-tight">Video AI CRM</p><p className="text-[10px] text-zinc-400 leading-tight">Agency Manager</p></div>
        </div>
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {visibleNav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setSideOpen(false)}
              className={({ isActive }) => `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
              <n.icon size={17} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{(user?.name || "?").split(" ").pop()[0]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[11px] text-zinc-400">{user?.role === "admin" ? "Quản trị viên" : user?.position || "Nhân viên"}</p>
            </div>
            <button onClick={() => setPwOpen(true)} title="Đổi mật khẩu" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><KeyRound size={16} /></button>
            <button onClick={() => { logout(); nav("/login"); }} title="Đăng xuất" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      {sideOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 h-14 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 px-3 sm:px-5">
          <button className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" onClick={() => setSideOpen(true)}><Menu size={19} /></button>
          <div className="relative flex-1 max-w-md ml-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input className={inputCls + " pl-9 py-1.5"} placeholder="Tìm khách hàng, SĐT, dự án..." value={gq} onChange={e => setGq(e.target.value)} />
            {results && (
              <div className={`absolute top-full mt-1.5 w-full ${cardCls} p-2 max-h-80 overflow-y-auto z-30`}>
                {results.customers.length > 0 && <p className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase">Khách hàng</p>}
                {results.customers.map(c => <button key={c.id} className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm" onClick={() => { nav("/customers"); setGq(""); setResults(null); }}><span className="font-medium">{c.name}</span> <span className="text-xs text-zinc-400">· {c.phone}</span></button>)}
                {results.projects.length > 0 && <p className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase">Dự án</p>}
                {results.projects.map(p => <button key={p.id} className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm" onClick={() => { nav(`/projects?open=${p.id}`); setGq(""); setResults(null); }}><span className="font-medium">{p.title}</span> <span className="text-xs text-zinc-400">· {p.assigned_name || "—"}</span></button>)}
                {!results.customers.length && !results.projects.length && <p className="px-2.5 py-3 text-sm text-zinc-400">Không tìm thấy kết quả.</p>}
              </div>
            )}
          </div>
          <div className="relative">
            <button className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" onClick={() => setBellOpen(!bellOpen)}>
              <Bell size={18} />
              {totalNotifs > 0 && <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{totalNotifs}</span>}
            </button>
            {bellOpen && (
              <div className={`absolute right-0 top-full mt-1.5 w-80 ${cardCls} p-2 max-h-96 overflow-y-auto z-30`}>
                <p className="px-2 py-1 text-xs font-semibold text-zinc-500">Thông báo ({totalNotifs})</p>
                {notifs.deadlines.map(n => (
                  <button key={"d" + n.project_id} onClick={() => { setBellOpen(false); nav(`/projects?open=${n.project_id}`); }} className="w-full flex items-start gap-2 text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Clock size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">
                      {n.days_left < 0 ? `"${n.title}" đã trễ hạn ${-n.days_left} ngày` : `"${n.title}" đến hạn ${n.days_left === 0 ? "hôm nay" : `trong ${n.days_left} ngày`}`}
                    </span>
                  </button>
                ))}
                {notifs.debts.map(n => (
                  <button key={"b" + n.project_id} onClick={() => { setBellOpen(false); nav(`/projects?open=${n.project_id}`); }} className="w-full flex items-start gap-2 text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <CircleDollarSign size={14} className="text-rose-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">{n.customer_name} còn nợ {Number(n.remaining).toLocaleString("vi-VN")} ₫ ({n.title})</span>
                  </button>
                ))}
                {!totalNotifs && <p className="px-2.5 py-4 text-sm text-zinc-400 text-center">Không có thông báo mới 🎉</p>}
              </div>
            )}
          </div>
        </header>

        <main className="p-3 sm:p-5 max-w-7xl mx-auto" onClick={() => { bellOpen && setBellOpen(false); results && setResults(null); }}>
          <Outlet />
        </main>
      </div>

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
      <ToastHost />
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setOk("");
    if (newPass.length < 6) return setErr("Mật khẩu mới phải từ 6 ký tự");
    if (newPass !== confirm) return setErr("Mật khẩu xác nhận không khớp");
    setLoading(true);
    try {
      await api.put("/auth/change-password", { old_password: oldPass, new_password: newPass });
      setOk("Đã đổi mật khẩu thành công!");
      setOldPass(""); setNewPass(""); setConfirm("");
    } catch (e) { setErr(errMsg(e)); } finally { setLoading(false); }
  };

  return (
    <Modal title="Đổi mật khẩu" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Mật khẩu hiện tại"><input type="password" className={inputCls} value={oldPass} onChange={e => setOldPass(e.target.value)} /></Field>
        <Field label="Mật khẩu mới (tối thiểu 6 ký tự)"><input type="password" className={inputCls} value={newPass} onChange={e => setNewPass(e.target.value)} /></Field>
        <Field label="Xác nhận mật khẩu mới"><input type="password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} /></Field>
        {err && <p className="text-xs text-red-500">{err}</p>}
        {ok && <p className="text-xs text-emerald-600 dark:text-emerald-400">{ok}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className={btnSec} onClick={onClose}>Đóng</button>
        <button className={btnPri} disabled={loading || !oldPass || !newPass} onClick={submit}>{loading ? "Đang lưu..." : "Đổi mật khẩu"}</button>
      </div>
    </Modal>
  );
}
