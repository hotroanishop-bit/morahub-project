"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, CreditCard, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AnalyticsData {
  revenue: { total: number; change: number; daily: { date: string; amount: number }[] };
  users: { total: number; new: number; active: number };
  transactions: { total: number; success: number; failed: number; pending: number };
  topModels: { name: string; calls: number; revenue: number }[];
  topUsers: { name: string; email: string; spend: number; calls: number }[];
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchAnalytics();
  }, [user, period]);

  async function fetchAnalytics() {
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const d = await res.json();
      setData(d);
    } catch {} finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">📊 Analytics</h1>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}>
              {p === "7d" ? "7 ngày" : p === "30d" ? "30 ngày" : "90 ngày"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Doanh thu</p>
                <p className="text-2xl font-bold text-slate-900">{Number(data?.revenue?.total || 0).toLocaleString("vi-VN")}đ</p>
              </div>
              <div className={`flex items-center text-xs ${(data?.revenue?.change ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(data?.revenue?.change ?? 0) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(data?.revenue?.change ?? 0)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Users mới</p>
                <p className="text-2xl font-bold text-slate-900">{data?.users?.new || 0}</p>
              </div>
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Giao dịch</p>
                <p className="text-2xl font-bold text-slate-900">{data?.transactions?.total || 0}</p>
              </div>
              <CreditCard className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">✓ {data?.transactions?.success || 0}</span>
              <span className="text-red-600">✗ {data?.transactions?.failed || 0}</span>
              <span className="text-yellow-600">⏳ {data?.transactions?.pending || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Users active</p>
                <p className="text-2xl font-bold text-slate-900">{data?.users?.active || 0}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">💰 Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {data?.revenue?.daily?.map((d, i) => {
                const max = Math.max(...(data?.revenue?.daily || []).map(x => x.amount));
                const height = max > 0 ? (d.amount / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-[10px] text-slate-400">{new Date(d.date).getDate()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Models */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">🤖 Top Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topModels?.slice(0, 5).map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{m.name}</span>
                    <span className="text-xs text-slate-400">{m.calls} calls</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{Number(m.revenue).toLocaleString("vi-VN")}đ</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">👥 Top Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topUsers?.slice(0, 10).map((u, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-slate-700">{u.name || u.email}</span>
                    <span className="text-xs text-slate-400 ml-2">{u.calls} calls</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{Number(u.spend).toLocaleString("vi-VN")}đ</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
