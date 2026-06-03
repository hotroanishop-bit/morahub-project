"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, History, Filter, ChevronDown } from "lucide-react";

interface AuditLog { id: string; action: string; entity: string; entityId: string | null; details: string | null; ip: string | null; createdAt: string; user: { name: string; email: string } | null }

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  APPROVE_DEPOSIT: "bg-green-50 text-green-700 border-green-200",
  REJECT_DEPOSIT: "bg-orange-50 text-orange-700 border-orange-200",
  LOGIN: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => { fetchLogs(); }, [entity, action]);

  async function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (entity) params.set("entity", entity);
    if (action) params.set("action", action);
    const res = await fetch(`/api/admin/audit?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }

  function parseDetails(d: string | null) {
    if (!d) return null;
    try { return JSON.parse(d); } catch { return d; }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-slate-500 mt-1 text-sm">Lịch sử thao tác admin</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={entity} onChange={(e) => setEntity(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900">
          <option value="">Tất cả entities</option>
          <option value="AiModel">Model</option>
          <option value="Transaction">Transaction</option>
          <option value="User">User</option>
          <option value="ApiKey">API Key</option>
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900">
          <option value="">Tất cả actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="APPROVE_DEPOSIT">Approve Deposit</option>
          <option value="REJECT_DEPOSIT">Reject Deposit</option>
        </select>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có audit log</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Thời gian</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Admin</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Entity</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const details = parseDetails(log.details);
                  return (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-700">{log.user?.name || "System"}</div>
                        <div className="text-[10px] text-slate-400">{log.user?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${actionColors[log.action] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{log.entity}{log.entityId && <span className="text-slate-400 ml-1">#{log.entityId.slice(0, 8)}</span>}</td>
                      <td className="px-4 py-3">
                        {details && typeof details === "object" ? (
                          <div className="text-[10px] text-slate-500 font-mono">{JSON.stringify(details)}</div>
                        ) : details ? (
                          <div className="text-[10px] text-slate-500">{String(details)}</div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
