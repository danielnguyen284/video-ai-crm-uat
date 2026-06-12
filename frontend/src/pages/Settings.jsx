import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import api from "../api/client";
import { inputCls, btnPri, cardCls, Field, Spinner, ErrorBox, errMsg, showToast } from "../components/ui";
import { DEFAULT_RESOURCE_FIELDS, QUICK_RESOURCES } from "../utils/constants";

const QR_MAP = Object.fromEntries(QUICK_RESOURCES.map(r => [r.key, r]));

export default function Settings() {
  const [f, setF] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings/default-resources").then(r => setF(r.data)).catch(e => setErr(errMsg(e)));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings/default-resources", f);
      showToast("✅ Đã lưu cài đặt");
    } catch (e) { alert(errMsg(e)); } finally { setSaving(false); }
  };

  if (err) return <ErrorBox msg={err} />;
  if (!f) return <Spinner />;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className={`${cardCls} p-4`}>
        <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2"><SettingsIcon size={16} /> Mẫu link mặc định cho dự án mới</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Khi tạo dự án mới, các link dưới đây sẽ được tự động điền vào tab "📂 Tài nguyên".
          Người tạo dự án chỉ cần nhập thêm <b>Google Drive dự án</b> và <b>Link Video bàn giao</b> (mỗi dự án khác nhau).
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {DEFAULT_RESOURCE_FIELDS.map(([key, label]) => {
            const item = QR_MAP[key];
            const Icon = item?.icon;
            return (
              <Field key={key} label={
                <span className="inline-flex items-center gap-1.5">
                  {Icon && <span className={`w-5 h-5 rounded ${item.color.split(" ")[0]} text-white flex items-center justify-center`}><Icon size={11} /></span>}
                  {label}
                </span>
              }>
                <input className={inputCls} placeholder="https://..." value={f[key] || ""} onChange={e => setF({ ...f, [key]: e.target.value })} />
              </Field>
            );
          })}
        </div>
        <div className="flex justify-end mt-4">
          <button className={btnPri} disabled={saving} onClick={save}><Save size={15} /> {saving ? "Đang lưu..." : "Lưu cài đặt"}</button>
        </div>
      </div>
    </div>
  );
}
