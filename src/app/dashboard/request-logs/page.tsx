"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface RequestLog { id: string; model: string; endpoint: string; statusCode: number; latency: number; tokensIn: number; tokensOut: number; cost: number; ip: string; createdAt: string }

export default function RequestLogsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("");
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);

  useEffect(() => { fetchLogs(); }, [page, model, status]);

  async function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (model) params.set("model", model);
    if (status) params.set("status", status);
    const res = await fetch(`/api/request-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setPages(data.pages || 0);
    setLoading(false);
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Request Logs</h1>
        <p className="text-slate-500 mt-1 text-sm">Chi tiết từng request đã gửi — {total.toLocaleString()} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" value={model} onChange={(e) => { setModel(e.target.value); setPage(1); }} placeholder="Filter by model..."
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900">
          <option value="">Tất cả status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có request log</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Thời gian</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Model</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Latency</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Tokens</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Cost</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3"><span className="text-xs font-medium text-slate-700">{log.model}</span></td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.statusCode < 400 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs ${log.latency > 5000 ? "text-red-600" : log.latency > 2000 ? "text-amber-600" : "text-slate-600"}`}>
                          {log.latency}ms
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-600">↓{log.tokensIn} ↑{log.tokensOut}</td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-indigo-600">{Number(log.cost).toLocaleString("vi-VN")}đ</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)} className="text-indigo-500 hover:text-indigo-700">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-600 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">Trang {page}/{pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-white text-slate-600 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
