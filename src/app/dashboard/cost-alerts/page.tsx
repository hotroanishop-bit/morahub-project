"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, DollarSign, AlertTriangle, Check } from "lucide-react";

interface AlertSettings { dailyLimit: number; monthlyLimit: number; emailAlert: boolean }

export default function CostAlertsPage() {
  const [settings, setSettings] = useState<AlertSettings>({ dailyLimit: 100000, monthlyLimit: 3000000, emailAlert: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.costAlerts) setSettings(d.costAlerts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costAlerts: settings }),
      });
      toast.success("Đã lưu cài đặt!");
    } catch {
      toast.error("Lỗi lưu");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Cảnh Báo Chi Phí</h1>
        <p className="text-slate-500 mt-1 text-sm">Đặt hạn mức và nhận cảnh báo khi chi phí vượt ngưỡng</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-500" /> Hạn Mức Chi Phí</h3>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 text-sm">Hạn mức ngày (VND)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="number" value={settings.dailyLimit} onChange={(e) => setSettings({ ...settings, dailyLimit: parseInt(e.target.value) || 0 })} className="bg-slate-50 border-slate-200 text-slate-900 pl-9 rounded-xl h-10 text-sm" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Cảnh báo khi chi phí trong ngày vượt mức này</p>
          </div>

          <div>
            <Label className="text-slate-700 text-sm">Hạn mức tháng (VND)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="number" value={settings.monthlyLimit} onChange={(e) => setSettings({ ...settings, monthlyLimit: parseInt(e.target.value) || 0 })} className="bg-slate-50 border-slate-200 text-slate-900 pl-9 rounded-xl h-10 text-sm" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Cảnh báo khi chi phí trong tháng vượt mức này</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <input type="checkbox" checked={settings.emailAlert} onChange={(e) => setSettings({ ...settings, emailAlert: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
            <div>
              <div className="text-sm font-medium text-slate-700">Gửi email cảnh báo</div>
              <div className="text-xs text-slate-400">Nhận email khi vượt hạn mức</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">
            {saving ? "Đang lưu..." : "Lưu Cài Đặt"}
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-amber-700">Lưu ý</div>
          <div className="text-xs text-amber-600 mt-1">Khi vượt hạn mức, API sẽ vẫn hoạt động nhưng bạn sẽ nhận được cảnh báo. Để chặn API, vui lòng liên hệ admin.</div>
        </div>
      </div>
    </div>
  );
}
