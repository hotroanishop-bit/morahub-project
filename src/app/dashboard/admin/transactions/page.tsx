"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw, DollarSign, CheckCircle, XCircle, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  status: string;
  paymentMethod: string;
  note: string;
  createdAt: string;
  user: { name: string; email: string };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-700",
};

export default function AdminTransactionsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchTransactions();
  }, [user, statusFilter]);

  async function fetchTransactions() {
    try {
      const res = await fetch(`/api/admin/transactions?status=${statusFilter}&search=${search}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {} finally { setLoading(false); }
  }

  async function refundTransaction(id: string) {
    if (!confirm("Xác nhận hoàn tiền?")) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, action: "refund" }),
      });
      await fetchTransactions();
    } catch {} finally { setActionLoading(null); }
  }

  async function manualCredit(userId: string, amount: number) {
    const creditAmount = prompt("Số tiền muốn cộng (VND):");
    if (!creditAmount) return;
    setActionLoading(userId);
    try {
      await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "credit", amount: parseInt(creditAmount) }),
      });
      await fetchTransactions();
    } catch {} finally { setActionLoading(null); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">💳 Quản lý Giao dịch</h1>
        <Button onClick={fetchTransactions} variant="outline" size="sm"><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchTransactions()}
            placeholder="Tìm theo mã, email..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
          <option value="all">Tất cả</option>
          <option value="PENDING">⏳ Pending</option>
          <option value="COMPLETED">✅ Completed</option>
          <option value="FAILED">❌ Failed</option>
          <option value="REFUNDED">↩️ Refunded</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Mã</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">User</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Số tiền</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Trạng thái</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Ngày</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b hover:bg-slate-50 transition">
                    <td className="p-3 text-xs font-mono text-slate-600">{t.reference || t.id.slice(0, 8)}</td>
                    <td className="p-3">
                      <p className="text-sm text-slate-800">{t.user?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{t.user?.email}</p>
                    </td>
                    <td className="p-3 text-sm font-bold text-slate-900">{Number(t.amount).toLocaleString("vi-VN")}đ</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="p-3 text-xs text-slate-400">{new Date(t.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="p-3">
                      {t.status === "PENDING" && (
                        <Button onClick={() => refundTransaction(t.id)} size="sm" variant="outline" className="text-[10px] h-6 text-orange-600"
                          disabled={actionLoading === t.id}>
                          Hoàn tiền
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && <p className="text-center py-8 text-slate-400">Không có giao dịch</p>}
        </CardContent>
      </Card>
    </div>
  );
}
