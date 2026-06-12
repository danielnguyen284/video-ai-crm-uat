import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Clapperboard, Clock, CheckCircle2, CircleDollarSign, Wallet,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { cardCls, Empty, Spinner, ErrorBox, errMsg } from "../components/ui";
import { PROJECT_STATUS } from "../utils/constants";
import { money, fmtDate, daysLeft, deadlineBadge } from "../utils/format";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/dashboard").then(r => setData(r.data)).catch(e => setErr(errMsg(e)));
  }, []);

  if (err) return <ErrorBox msg={err} />;
  if (!data) return <Spinner />;

  const stats = [
    { label: "Khách hàng", value: data.totalCustomers, icon: Users, cls: "bg-blue-500" },
    { label: "Tổng dự án", value: data.totalProjects, icon: Clapperboard, cls: "bg-violet-500" },
    { label: "Đang thực hiện", value: data.activeProjects, icon: Clock, cls: "bg-amber-500" },
    { label: "Hoàn thành", value: data.doneProjects, icon: CheckCircle2, cls: "bg-emerald-500" },
    ...(isAdmin ? [
      { label: "Tổng doanh thu", value: money(data.revenue.total), icon: CircleDollarSign, cls: "bg-teal-500" },
      { label: "Doanh thu tháng này", value: money(data.revenue.month), icon: Wallet, cls: "bg-cyan-500" },
      { label: "Công nợ khách hàng", value: money(data.revenue.debt), icon: AlertTriangle, cls: "bg-rose-500" },
    ] : []),
  ];

  const monthly = (data.monthlyRevenue || []).map(m => {
    const [y, mo] = m.month.split("-");
    return { name: `T${Number(mo)}/${y.slice(2)}`, doanhthu: Number(m.revenue) };
  });

  const statusData = (data.projectStatus || []).map(s => ({
    name: PROJECT_STATUS[s.status]?.label || s.status,
    value: Number(s.count),
    fill: PROJECT_STATUS[s.status]?.dot || "#94a3b8",
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`${cardCls} p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl ${s.cls} text-white flex items-center justify-center shrink-0`}><s.icon size={19} /></div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
              <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {isAdmin && (
          <div className={`${cardCls} p-4`}>
            <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3">Doanh thu các tháng gần đây</h3>
            <div className="h-56">
              {monthly.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#71717a33" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#a1a1aa" tickFormatter={v => (v / 1e6) + "tr"} />
                    <RTooltip formatter={v => money(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="doanhthu" name="Doanh thu" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty icon={Wallet} text="Chưa có dữ liệu doanh thu" />}
            </div>
          </div>
        )}
        <div className={`${cardCls} p-4`}>
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3">Trạng thái dự án</h3>
          <div className="h-56">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty icon={Clapperboard} text="Chưa có dự án" />}
          </div>
        </div>
        <div className={`${cardCls} p-4 ${isAdmin ? "lg:col-span-2" : ""}`}>
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500" /> ⚠️ Dự án sắp tới hạn</h3>
          {data.dueSoon?.length ? (
            <div className="space-y-2">
              {data.dueSoon.map(p => {
                const b = deadlineBadge(p.deadline, p.status) || { label: `Còn ${p.days_left} ngày`, cls: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200" };
                return (
                  <button key={p.id} onClick={() => nav(`/projects?open=${p.id}`)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{p.title}</p>
                      <p className="text-xs text-zinc-400">Hạn giao: {fmtDate(p.deadline)}</p>
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-full ${b.cls}`}>{b.label}</span>
                  </button>
                );
              })}
            </div>
          ) : <p className="text-sm text-zinc-400 py-4 text-center">Không có dự án nào sắp đến hạn 🎉</p>}
        </div>
      </div>
    </div>
  );
}
