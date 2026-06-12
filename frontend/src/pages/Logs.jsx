import React, { useEffect, useState } from "react";
import { History } from "lucide-react";
import api from "../api/client";
import { inputCls, cardCls, Empty, Spinner, ErrorBox, errMsg } from "../components/ui";
import { fmtTime } from "../utils/format";

const MODS = { customers: "Khách hàng", projects: "Dự án", payments: "Thanh toán", users: "Nhân viên", resources: "Tài nguyên", settings: "Cài đặt" };
const ACT_COLOR = { create: "bg-emerald-500", update: "bg-blue-500", delete: "bg-red-500", login: "bg-zinc-400" };

export default function Logs() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [fMod, setFMod] = useState("");

  useEffect(() => {
    api.get("/logs", { params: { module: fMod || undefined } })
      .then(r => setList(r.data)).catch(e => setErr(errMsg(e)));
  }, [fMod]);

  if (err) return <ErrorBox msg={err} />;
  if (!list) return <Spinner />;

  return (
    <div className="space-y-4">
      <select className={inputCls + " w-auto"} value={fMod} onChange={e => setFMod(e.target.value)}><option value="">Tất cả module</option>{Object.entries(MODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <div className={`${cardCls} divide-y divide-zinc-100 dark:divide-zinc-800/70`}>
        {list.length ? list.map(l => (
          <div key={l.id} className="flex items-start gap-3 px-4 py-3">
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${ACT_COLOR[l.action] || "bg-zinc-400"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{l.description}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{l.user_name || "—"} · {MODS[l.module] || l.module} · {fmtTime(l.created_at)}</p>
            </div>
          </div>
        )) : <Empty icon={History} text="Chưa có hoạt động" />}
      </div>
    </div>
  );
}
