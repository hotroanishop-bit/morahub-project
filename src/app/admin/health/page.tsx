"use client";

import { useState, useEffect } from "react";
import { Activity, Cpu, Zap, AlertTriangle, Users, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthData {
  summary: { totalCalls24h: number; errorCalls24h: number; successRate: string; avgLatency: string; activeUsers: number };
  byModel: { name: string; displayName: string; provider: string; isActive: boolean; calls: number; avgLatency: string; errors: number; errorRate: string }[];
  errors: { message: string; count: number }[];
  hourlyCalls: { hour: string; calls: number; errors: number }[];
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHealth(); }, []);

  async function fetchHealth() {
    setLoading(true);
    const res = await fetch("/api/admin/health");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  const maxCalls = Math.max(...(data?.hourlyCalls?.map(h => h.calls) || [1]));

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">System Health</h1>
          <p className="text-slate-500 mt-1 text-sm">Giám sát hệ thống real-time — 24h gần nhất</p>
        </div>
        <Button onClick={fetchHealth} variant="outline" className="rounded-xl text-xs"><RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : !data ? (
        <div className="text-center py-12 text-slate-400 text-sm">Không có dữ liệu</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2"><Activity className="w-5 h-5 text-blue-600" /></div>
              <div className="text-xs text-slate-500">Requests/24h</div>
              <div className="text-xl font-extrabold text-slate-900">{data.summary.totalCalls24h.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2"><Zap className="w-5 h-5 text-emerald-600" /></div>
              <div className="text-xs text-slate-500">Success Rate</div>
              <div className="text-xl font-extrabold text-emerald-600">{data.summary.successRate}%</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-2"><Clock className="w-5 h-5 text-amber-600" /></div>
              <div className="text-xs text-slate-500">Avg Latency</div>
              <div className="text-xl font-extrabold text-slate-900">{data.summary.avgLatency}ms</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-2"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div className="text-xs text-slate-500">Errors/24h</div>
              <div className="text-xl font-extrabold text-red-600">{data.summary.errorCalls24h}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-2"><Users className="w-5 h-5 text-indigo-600" /></div>
              <div className="text-xs text-slate-500">Active Users (1h)</div>
              <div className="text-xl font-extrabold text-indigo-600">{data.summary.activeUsers}</div>
            </div>
          </div>

          {/* Hourly chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Requests / Giờ (24h)</h3>
            <div className="flex items-end gap-1 h-32">
              {data.hourlyCalls.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {h.hour}: {h.calls} calls, {h.errors} errors
                  </div>
                  <div className="w-full flex gap-px">
                    <div className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm" style={{ height: `${maxCalls > 0 ? (h.calls / maxCalls) * 100 : 0}%`, minHeight: h.calls > 0 ? "2px" : "0" }} />
                    {h.errors > 0 && <div className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm" style={{ height: `${maxCalls > 0 ? (h.errors / maxCalls) * 100 : 0}%`, minHeight: "2px" }} />}
                  </div>
                  <span className="text-[8px] text-slate-400">{h.hour.slice(0, 2)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Calls</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Errors</span>
            </div>
          </div>

          {/* Model health */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-indigo-500" /> Model Health</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Model</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Calls</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Avg Latency</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Errors</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Error Rate</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byModel.map((m) => (
                    <tr key={m.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-700">{m.displayName || m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.provider}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-slate-600">{m.calls.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-xs text-slate-600">{m.avgLatency}ms</td>
                      <td className="px-3 py-2 text-right text-xs text-red-600">{m.errors}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        <span className={parseFloat(m.errorRate) > 5 ? "text-red-600 font-bold" : parseFloat(m.errorRate) > 1 ? "text-amber-600" : "text-emerald-600"}>{m.errorRate}%</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {m.isActive ? "✓ Active" : "✗ Down"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Errors */}
          {data.errors.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Top Errors</h3>
              <div className="space-y-2">
                {data.errors.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-xs text-red-700 font-mono truncate flex-1">{e.message}</span>
                    <span className="text-xs font-bold text-red-600 ml-2">{e.count}</span>
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


