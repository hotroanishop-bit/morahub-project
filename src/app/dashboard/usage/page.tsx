"use client";

import { useState, useEffect } from "react";
import { BarChart3, Calendar, TrendingUp, Zap, Clock } from "lucide-react";

interface UsageStats { totalRequests: number; totalTokens: number; successRate: number; avgLatency: number; byDay: { date: string; requests: number; tokens: number }[]; byModel: { model: string; requests: number; tokens: number }[] }

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage-logs?period=${period}`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const maxRequests = Math.max(...(stats?.byDay?.map(d => d.requests) || [1]));

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Sử Dụng</h1>
          <p className="text-slate-500 mt-1 text-sm">Thống kê sử dụng API</p>
        </div>
        <div className="flex gap-1.5">
          {["24h", "7d", "30d"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${period === p ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200"}`}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : !stats ? (
        <div className="text-center py-12 text-slate-400 text-sm">Không có dữ liệu</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
              <div className="text-xs text-slate-500">Tổng Requests</div>
              <div className="text-xl font-extrabold text-slate-900">{stats.totalRequests.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2"><Zap className="w-5 h-5 text-emerald-600" /></div>
              <div className="text-xs text-slate-500">Tổng Tokens</div>
              <div className="text-xl font-extrabold text-slate-900">{stats.totalTokens.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-2"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
              <div className="text-xs text-slate-500">Tỷ Lệ Thành Công</div>
              <div className="text-xl font-extrabold text-slate-900">{stats.successRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-2"><Clock className="w-5 h-5 text-amber-600" /></div>
              <div className="text-xs text-slate-500">Độ Trễ TB</div>
              <div className="text-xl font-extrabold text-slate-900">{stats.avgLatency.toFixed(0)}ms</div>
            </div>
          </div>

          {/* Bar Chart */}
          {stats.byDay.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Requests Theo Ngày</h3>
              <div className="flex items-end gap-2 h-40">
                {stats.byDay.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">{d.requests}</span>
                    <div className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all" style={{ height: `${(d.requests / maxRequests) * 100}%`, minHeight: d.requests > 0 ? "4px" : "0" }} />
                    <span className="text-[10px] text-slate-400">{d.date.split("-").slice(1).join("/")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Model */}
          {stats.byModel.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Sử Dụng Theo Model</h3>
              <div className="space-y-3">
                {stats.byModel.map((m) => (
                  <div key={m.model}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{m.model}</span>
                      <span className="text-xs text-slate-500">{m.requests} requests · {m.tokens.toLocaleString()} tokens</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${(m.requests / stats.totalRequests) * 100}%` }} />
                    </div>
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
