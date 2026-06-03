"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Wallet, Key, TrendingUp, Zap, ArrowUpRight, Clock, Activity, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => { console.error("Dashboard error:", e); setData(null); })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Vui lòng đăng nhập</p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Không thể tải dữ liệu</p>
        <p className="text-xs text-slate-400 mt-2">{data?.error || "Unknown error"}</p>
      </div>
    );
  }

  const user = data.user;
  const todayUsage = data.todayUsage || { calls: 0, cost: 0 };
  const usageByDay = data.usageByDay || [];
  const usageByModel = data.usageByModel || [];
  const recentUsage = data.recentUsage || [];

  const stats = [
    { label: "Credits", value: Number(user?.creditBalance || 0).toLocaleString(), icon: Wallet, bg: "bg-indigo-50", text: "text-indigo-600", sub: data.plan?.displayName || "Free" },
    { label: "Hôm Nay", value: todayUsage.calls.toString(), icon: Zap, bg: "bg-blue-50", text: "text-blue-600", sub: `$${Number(todayUsage.cost).toFixed(4)}` },
    { label: "Tổng Lượt", value: (data.totalUsage || 0).toLocaleString(), icon: BarChart3, bg: "bg-emerald-50", text: "text-emerald-600", sub: "all-time" },
    { label: "Keys", value: (data.activeKeys || 0).toString(), icon: Key, bg: "bg-amber-50", text: "text-amber-600", sub: "active" },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Tổng Quan</h1>
        <p className="text-slate-500 mt-1 text-sm">Xin chào <span className="font-semibold text-indigo-600">{user?.name || "bạn"}</span>! 👋</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 lg:p-5 hover:shadow-lg hover:shadow-slate-100/80 transition-all">
            <div className="flex items-start justify-between mb-2 lg:mb-3">
              <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${s.text}`} />
              </div>
            </div>
            <div className="text-xs lg:text-sm text-slate-500 font-medium">{s.label}</div>
            <div className="text-lg lg:text-2xl font-extrabold text-slate-900 mt-0.5">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 text-sm lg:text-base">Sử Dụng (7 Ngày)</h3>
          </div>
          <div className="p-4 lg:p-6">
            <div className="h-48">
              {usageByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis stroke="#94a3b8" fontSize={10} width={35} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                    <Bar dataKey="calls" fill="#6366f1" radius={[6, 6, 0, 0]} name="Calls" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-slate-900 text-sm lg:text-base">Theo Model</h3>
          </div>
          <div className="p-4 lg:p-6">
            <div className="h-48">
              {usageByModel.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByModel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis type="category" dataKey="model" stroke="#94a3b8" fontSize={10} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                    <Bar dataKey="calls" fill="#a855f7" radius={[0, 6, 6, 0]} name="Calls" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Usage */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-500" />
          <h3 className="font-bold text-slate-900 text-sm lg:text-base">Gần Đây</h3>
        </div>
        {recentUsage.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Chưa có sử dụng</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentUsage.slice(0, 5).map((log: any) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs">{log.model?.displayName || log.model?.name || "Unknown"}</Badge>
                  <div className="text-xs text-slate-500 mt-1">{log.apiKey?.name || ""} · {new Date(log.createdAt).toLocaleDateString("vi-VN")}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">${Number(log.cost).toFixed(4)}</div>
                  <div className="text-xs text-slate-400">{(log.tokensIn + log.tokensOut).toLocaleString()} tokens</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
