import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, AlertTriangle, Wallet } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { btnSec, cardCls, Empty, Spinner, ErrorBox, errMsg } from "../components/ui";
import { money, fmtDate, downloadFile, csv } from "../utils/format";

export default function Payments() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const [pays, setPays] = useState(null);
  const [debts, setDebts] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/payments").then(r => setPays(r.data)).catch(e => setErr(errMsg(e)));
    if (isAdmin) api.get("/payments/debts").then(r => setDebts(r.data)).catch(() => {});
  }, [isAdmin]);

  const exportRevenue = () => {
    const rows = [["Mã GD", "Dự án", "Khách hàng", "Số tiền", "Phương thức", "Ngày", "Ghi chú"]];
    (pays || []).forEach(t => rows.push([t.id, t.project_title, t.customer_name, t.amount, t.payment_method, fmtDate(t.payment_date), t.note]));
    downloadFile("doanh-thu.csv", csv(rows), "text/csv;charset=utf-8");
  };

  // Gom công nợ theo khách hàng
  const byCustomer = {};
  debts.forEach(d => {
    byCustomer[d.customer_id] = byCustomer[d.customer_id] || { name: d.customer_name, total: 0, items: [] };
    byCustomer[d.customer_id].total += Number(d.remaining);
    byCustomer[d.customer_id].items.push(d);
  });

  if (err) return <ErrorBox msg={err} />;
  if (!pays) return <Spinner />;

  return (
    <div className="space-y-5">
      {isAdmin && Object.keys(byCustomer).length > 0 && (
        <div className={`${cardCls} p-4`}>
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-rose-500" /> Khách hàng còn công nợ</h3>
          <div className="space-y-2">
            {Object.entries(byCustomer).map(([cid, v]) => (
              <div key={cid} className="rounded-lg bg-rose-50/60 dark:bg-rose-500/5 border border-rose-200/60 dark:border-rose-500/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{v.name}</p>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{money(v.total)}</p>
                </div>
                <div className="mt-1.5 space-y-1">
                  {v.items.map(it => (
                    <button key={it.project_id} onClick={() => nav(`/projects?open=${it.project_id}`)} className="w-full flex justify-between text-xs text-zinc-500 hover:text-blue-600 text-left">
                      <span className="truncate">↳ {it.project_title}</span><span>{money(it.remaining)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={`${cardCls} overflow-x-auto`}>
        <div className="flex items-center justify-between px-4 pt-4">
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Lịch sử giao dịch</h3>
          {isAdmin && <button className={btnSec} onClick={exportRevenue}><Download size={15} /> Xuất Excel doanh thu</button>}
        </div>
        {pays.length ? (
          <table className="w-full text-sm min-w-[680px] mt-2">
            <thead><tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 font-medium">Mã GD</th><th className="px-3 py-3 font-medium">Dự án</th><th className="px-3 py-3 font-medium">Số tiền</th><th className="px-3 py-3 font-medium">Phương thức</th><th className="px-3 py-3 font-medium">Ngày</th><th className="px-3 py-3 font-medium">Ghi chú</th>
            </tr></thead>
            <tbody>
              {pays.map(t => (
                <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3 text-xs font-mono text-zinc-400">#{t.id}</td>
                  <td className="px-3 py-3"><button className="text-zinc-800 dark:text-zinc-200 hover:text-blue-600 text-left text-xs font-medium" onClick={() => nav(`/projects?open=${t.project_id}`)}>{t.project_title}</button></td>
                  <td className="px-3 py-3 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{money(t.amount)}</td>
                  <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">{t.payment_method}</td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{fmtDate(t.payment_date)}</td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{t.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon={Wallet} text="Chưa có giao dịch" />}
      </div>
    </div>
  );
}
