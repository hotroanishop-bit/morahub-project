"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Target, BarChart3, PieChart } from "lucide-react";

interface BIData {
  revenue: { total: number; target: number; daily: { date: string; amount: number }[] };
  users: { total: number; new: number; churned: number; retention: number };
  api: { totalCalls: number; avgLatency: number; errorRate: number };
  predictions: { nextMonthRevenue: number; nextMonthUsers: number; confidence: number };
}

export default function BusinessIntelligencePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [data, setData] = useState<BIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchBI();
  }, [user, period]);

  async function fetchBI() {
    try {
      const res = await fetch(`/api/admin/bi?period=${period}`);
      const d = await res.json();
      setData(d);
    } catch {} finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const revenueProgress = data?.revenue?.target ? (data.revenue.total / data.revenue.target * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">📈 Business Intelligence</h1>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}>
              {p === "7d" ? "7 ngày" : p === "30d" ? "30 ngày" : "90 ngày"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Doanh thu mục tiêu</p>
                <p className="text-2xl font-bold text-slate-900">{revenueProgress.toFixed(0)}%</p>
              </div>
              <Target className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: `${Math.min(revenueProgress, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">User retention</p>
                <p className="text-2xl font-bold text-slate-900">{data?.users?.retention || 0}%</p>
              </div>
              {(data?.users?.retention ?? 0) >= 50 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Error rate</p>
                <p className="text-2xl font-bold text-slate-900">{data?.api?.errorRate || 0}%</p>
              </div>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Doanh thu dự đoán</p>
                <p className="text-2xl font-bold text-slate-900">{Number(data?.predictions?.nextMonthRevenue || 0).toLocaleString("vi-VN")}đ</p>
              </div>
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Confidence: {data?.predictions?.confidence || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📊 Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {data?.revenue?.daily?.slice(-14).map((d, i, arr) => {
                const max = Math.max(...arr.map(x => x.amount));
                const height = max > 0 ? (d.amount / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all" style={{ height: `${height}%` }} />
                    <span className="text-[10px] text-slate-400">{new Date(d.date).getDate()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* User Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">👥 User Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Tổng users</span>
              <span className="text-lg font-bold text-slate-900">{data?.users?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Users mới</span>
              <span className="text-lg font-bold text-green-600">+{data?.users?.new || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Users rời đi</span>
              <span className="text-lg font-bold text-red-600">-{data?.users?.churned || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Retained</span>
              <span className="text-lg font-bold text-indigo-600">{data?.users?.retention || 0}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Predictions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">🔮 Predictions (Next 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <p className="text-xs text-slate-400">Revenue</p>
                <p className="text-xl font-bold text-indigo-600">{Number(data?.predictions?.nextMonthRevenue || 0).toLocaleString("vi-VN")}đ</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-xs text-slate-400">New Users</p>
                <p className="text-xl font-bold text-purple-600">{data?.predictions?.nextMonthUsers || 0}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-xs text-slate-400">Confidence</p>
                <p className="text-xl font-bold text-green-600">{data?.predictions?.confidence || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
