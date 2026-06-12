import React, { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";

export const inputCls = "w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";
export const btnPri = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50";
export const btnSec = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors";
export const btnDanger = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors";
export const cardCls = "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm";

export function Badge({ map, value }) {
  const it = map[value];
  if (!it) return null;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${it.color || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>{it.label}</span>;
}

export function StatusDot({ status, map }) {
  const it = map[status];
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"><span className="w-2 h-2 rounded-full" style={{ background: it?.dot }} />{it?.label}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${cardCls} w-full ${wide ? "max-w-3xl" : "max-w-lg"} my-4`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, action, children }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 mb-1">
        <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}

export function Empty({ icon: Icon, text }) {
  return <div className="flex flex-col items-center justify-center py-14 text-zinc-400 dark:text-zinc-500"><Icon size={36} strokeWidth={1.5} /><p className="mt-2 text-sm">{text}</p></div>;
}

export function Confirm({ msg, onYes, onNo, busy }) {
  return (
    <Modal title="Xác nhận" onClose={onNo}>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{msg}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button className={btnSec} onClick={onNo} disabled={busy}>Hủy</button>
        <button className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50" onClick={onYes} disabled={busy}>Xóa</button>
      </div>
    </Modal>
  );
}

export function Spinner({ label = "Đang tải..." }) {
  return <div className="flex items-center justify-center py-14 text-zinc-400 text-sm gap-2">
    <span className="w-4 h-4 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />{label}
  </div>;
}

export function ErrorBox({ msg }) {
  if (!msg) return null;
  return <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm px-3 py-2 mb-3">{msg}</div>;
}

export function errMsg(e) {
  return e?.response?.data?.message || e?.message || "Đã có lỗi xảy ra";
}

/* ============ TOAST (thông báo "✅ Đã sao chép") ============ */
export function showToast(msg) {
  window.dispatchEvent(new CustomEvent("crm-toast", { detail: msg }));
}

export function ToastHost() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let timer;
    const handler = (e) => {
      setMsg(e.detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 2000);
    };
    window.addEventListener("crm-toast", handler);
    return () => { window.removeEventListener("crm-toast", handler); clearTimeout(timer); };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
      {msg}
    </div>
  );
}

/* ============ NÚT COPY NHANH (navigator.clipboard) ============ */
export function CopyButton({ text, label = "Copy", successText = "✅ Đã sao chép" }) {
  const [copied, setCopied] = useState(false);
  const onClick = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      showToast(successText);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      showToast("Không thể sao chép");
    }
  };
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shrink-0">
      {copied ? <Check size={12} /> : <Copy size={12} />} {label}
    </button>
  );
}
