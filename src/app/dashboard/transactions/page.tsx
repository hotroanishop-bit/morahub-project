"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeftRight, Download, CheckCircle, Clock, XCircle, RefreshCw, Filter } from "lucide-react";

interface Transaction { id: string; amount: number; paymentMethod: string; status: string; reference: string | null; note: string | null; adminNote: string | null; createdAt: string }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchTransactions(); }, []);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const res = await fetch("/api/deposit");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {}
    setLoading(false);
  }

  const filtered = transactions.filter((t) => {
    if (filter !== "ALL" && t.status !== filter) return false;
    if (search && !t.reference?.toLowerCase().includes(search.toLowerCase()) && !t.note?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: "Chờ xử lý", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    COMPLETED: { label: "Thành công", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    FAILED: { label: "Thất bại", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
    REFUNDED: { label: "Hoàn tiền", color: "bg-blue-50 text-blue-700 border-blue-200", icon: RefreshCw },
  };

  const methodLabels: Record<string, string> = { MOMO: "📱 MOMO", ZALOPAY: "💙 ZaloPay", BANKING: "🏦 Banking", VCB: "🏦 VietComBank", TCB: "🏦 Techcombank", BIDV: "🏦 BIDV", AGR: "🏦 Agribank", MB: "🏦 MB Bank", ACB: "🏦 ACB", STB: "🏦 Sacombank", ADMIN_GRANT: "🛡️ Admin Grant", SYSTEM: "⚙️ System" };

  const totalCompleted = transactions.filter((t) => t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
  const totalPending = transactions.filter((t) => t.status === "PENDING").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Lịch Sử Giao Dịch</h1>
          <p className="text-slate-500 mt-1 text-sm">{transactions.length} giao dịch</p>
        </div>
        <a href="/dashboard/top-up">
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">
            <span className="mr-2">+</span> Nạp Tiền
          </Button>
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <div className="text-xs text-emerald-600">Đã nạp</div>
          <div className="text-lg font-bold text-emerald-700">{totalCompleted.toLocaleString("vi-VN")}đ</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <div className="text-xs text-amber-600">Chờ xử lý</div>
          <div className="text-lg font-bold text-amber-700">{totalPending.toLocaleString("vi-VN")}đ</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
          <div className="text-xs text-indigo-600">Tổng giao dịch</div>
          <div className="text-lg font-bold text-indigo-700">{transactions.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm mã giao dịch..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
        {["ALL", "PENDING", "COMPLETED", "FAILED", "REFUNDED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === f ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            {f === "ALL" ? "Tất cả" : statusConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Không có giao dịch</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const sc = statusConfig[t.status] || statusConfig.PENDING;
              const Icon = sc.icon;
              return (
                <div key={t.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${sc.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{t.note || "Nạp tiền"}</span>
                        <Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>{methodLabels[t.paymentMethod] || t.paymentMethod}</span>
                        {t.reference && <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{t.reference}</code>}
                        <span>{new Date(t.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                      {t.adminNote && <div className="text-xs text-slate-400 mt-1 italic">Admin: {t.adminNote}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold text-sm ${t.status === "COMPLETED" ? "text-emerald-600" : t.status === "FAILED" ? "text-red-500" : "text-slate-900"}`}>
                        {t.status === "COMPLETED" ? "+" : ""}{t.amount.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
