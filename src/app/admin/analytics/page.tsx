"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Download, Users, Cpu, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Analytics {
  summary: { totalRevenue: number; totalApiCost: number; profit: number; totalTransactions: number };
  byDay: { date: string; revenue: number }[];
  byMethod: Record<string, number>;
  topModels: { name: string; displayName: string; provider: string; revenue: number; calls: number }[];
  topUsers: { name: string; email: string; spend: number; calls: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => { fetchAnalytics(); }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    const res = await fetch(`/api/admin/analytics?period=${period}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  function exportCsv() {
    window.open(`/api/admin/analytics?period=${period}&export=csv`, "_blank");
  }

  const maxRevenue = Math.max(...(data?.byDay?.map(d => d.revenue) || [1]));

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Revenue Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm">Phân tích doanh thu chi tiết</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {["7d", "30d", "90d", "12m"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${period === p ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200"}`}>{p}</button>
            ))}
          </div>
          <Button onClick={exportCsv} variant="outline" className="rounded-xl text-xs"><Download className="w-3.5 h-3.5 mr-1" /> CSV</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : !data ? (
        <div className="text-center py-12 text-slate-400 text-sm">Không có dữ liệu</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              <div className="text-xs text-slate-500">Doanh Thu</div>
              <div className="text-xl font-extrabold text-slate-900">{data.summary.totalRevenue.toLocaleString("vi-VN")}đ</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-2"><ArrowDownRight className="w-5 h-5 text-red-600" /></div>
              <div className="text-xs text-slate-500">Chi Phí API</div>
              <div className="text-xl font-extrabold text-red-600">{data.summary.totalApiCost.toLocaleString("vi-VN")}đ</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-2"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
              <div className="text-xs text-slate-500">Lợi Nhuận</div>
              <div className="text-xl font-extrabold text-indigo-600">{data.summary.profit.toLocaleString("vi-VN")}đ</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-2"><CreditCard className="w-5 h-5 text-amber-600" /></div>
              <div className="text-xs text-slate-500">Giao Dịch</div>
              <div className="text-xl font-extrabold text-slate-900">{data.summary.totalTransactions}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Doanh Thu Theo Ngày</h3>
            <div className="flex items-end gap-1 h-48">
              {data.byDay.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {d.date.split("-").slice(1).join("/")}: {d.revenue.toLocaleString("vi-VN")}đ
                  </div>
                  <div className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md transition-all hover:from-indigo-600 hover:to-purple-600" style={{ height: `${maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0}%`, minHeight: d.revenue > 0 ? "4px" : "0" }} />
                  {data.byDay.length <= 14 && <span className="text-[9px] text-slate-400">{d.date.split("-")[2]}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top Models */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-indigo-500" /> Top Models</h3>
              <div className="space-y-2">
                {data.topModels.slice(0, 5).map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{m.displayName || m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.provider} · {m.calls} calls</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">{m.revenue.toLocaleString("vi-VN")}đ</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500" /> Top Users</h3>
              <div className="space-y-2">
                {data.topUsers.slice(0, 5).map((u, i) => (
                  <div key={u.email} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{u.name || u.email}</div>
                        <div className="text-[10px] text-slate-400">{u.calls} calls</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{u.spend.toLocaleString("vi-VN")}đ</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {Object.keys(data.byMethod).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-3">Theo Phương Thức Thanh Toán</h3>
              <div className="flex gap-4">
                {Object.entries(data.byMethod).map(([method, amount]) => (
                  <div key={method} className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-500">{method}</div>
                    <div className="text-lg font-extrabold text-slate-900">{Number(amount).toLocaleString("vi-VN")}đ</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
