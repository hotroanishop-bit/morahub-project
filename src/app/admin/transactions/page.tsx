"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Filter, CheckCircle, XCircle, Clock } from "lucide-react";

interface Transaction { id: string; user: { name: string; email: string }; amount: number; paymentMethod: string; status: string; reference: string | null; note: string | null; createdAt: string }

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetch("/api/admin/transactions").then((r) => r.json()).then((d) => setTxs(d.transactions || [])).finally(() => setLoading(false)); }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/transactions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: id, status }) });
    if (res.ok) { toast.success(`Đã ${status === "COMPLETED" ? "duyệt" : "từ chối"}`); setTxs((prev) => prev.map((t) => t.id === id ? { ...t, status } : t)); }
  }

  const filtered = filter === "ALL" ? txs : txs.filter((t) => t.status === filter);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div><h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Giao Dịch</h1><p className="text-slate-500 mt-1 text-sm">{txs.length} giao dịch</p></div>
        <div className="flex gap-2 flex-wrap">
          {[{ v: "ALL", l: "Tất Cả" }, { v: "PENDING", l: "Chờ" }, { v: "COMPLETED", l: "Thành Công" }, { v: "FAILED", l: "Thất Bại" }].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === f.v ? "bg-indigo-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div> : filtered.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">Không có giao dịch</div> : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div key={t.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">{t.user.name || t.user.email}</div>
                    <div className="text-xs text-slate-500">{t.user.email}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={t.paymentMethod === "MOMO" ? "bg-pink-50 text-pink-700 border border-pink-200 text-[10px]" : t.paymentMethod === "ZALOPAY" ? "bg-blue-50 text-blue-700 border border-blue-200 text-[10px]" : t.paymentMethod === "ADMIN_GRANT" ? "bg-purple-50 text-purple-700 border border-purple-200 text-[10px]" : "bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]"}>{t.paymentMethod}</Badge>
                      <Badge className={t.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]" : t.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200 text-[10px]" : "bg-red-50 text-red-700 border border-red-200 text-[10px]"}>{t.status}</Badge>
                      {t.reference && <span className="text-xs text-slate-400 font-mono">{t.reference}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 text-sm">{Number(t.amount).toLocaleString()}₫</div>
                    <div className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString("vi-VN")}</div>
                    {t.status === "PENDING" && (
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" onClick={() => updateStatus(t.id, "COMPLETED")} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-7 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Duyệt</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "FAILED")} className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-7 text-xs"><XCircle className="w-3 h-3 mr-1" />Từ chối</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
