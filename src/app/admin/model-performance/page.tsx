"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cpu, Zap, Clock, AlertTriangle, TrendingUp, ArrowDownRight } from "lucide-react";

interface ModelPerf { name: string; displayName: string; provider: string; isActive: boolean; calls: number; tokensIn: number; tokensOut: number; totalTokens: number; revenue: number; avgLatency: string; errors: number; errorRate: string }

export default function AdminModelPerformancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => { fetchData(); }, [period]);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/admin/model-performance?period=${period}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Model Performance</h1>
          <p className="text-slate-500 mt-1 text-sm">Phân tích hiệu suất model chi tiết</p>
        </div>
        <div className="flex gap-1">
          {["24h", "7d", "30d"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${period === p ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200"}`}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : !data ? (
        <div className="text-center py-12 text-slate-400 text-sm">Không có dữ liệu</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">Tổng Calls</div>
              <div className="text-xl font-extrabold text-slate-900">{data.summary.totalCalls.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">Tổng Tokens</div>
              <div className="text-xl font-extrabold text-indigo-600">{(data.summary.totalTokens / 1000000).toFixed(1)}M</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">Tổng Revenue</div>
              <div className="text-xl font-extrabold text-emerald-600">{data.summary.totalCost.toLocaleString("vi-VN")}đ</div>
            </div>
          </div>

          {/* Model table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Model</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Calls</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Tokens</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Revenue</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Latency</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Errors</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.models.map((m: ModelPerf) => (
                    <tr key={m.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{m.displayName || m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.provider}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{m.calls.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-slate-700">{(m.totalTokens / 1000).toFixed(0)}K</div>
                        <div className="text-[10px] text-slate-400">↓{(m.tokensIn / 1000).toFixed(0)}K ↑{(m.tokensOut / 1000).toFixed(0)}K</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">{m.revenue.toLocaleString("vi-VN")}đ</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${parseInt(m.avgLatency) > 5000 ? "text-red-600" : parseInt(m.avgLatency) > 2000 ? "text-amber-600" : "text-emerald-600"}`}>
                          {m.avgLatency}ms
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${parseFloat(m.errorRate) > 5 ? "text-red-600" : parseFloat(m.errorRate) > 1 ? "text-amber-600" : "text-slate-600"}`}>
                          {m.errors} ({m.errorRate}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {m.isActive ? "Active" : "Down"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
