"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, User } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  reference: string | null;
  issueType: string | null;
  status: string;
  resolution: string | null;
  amount: number | null;
  wrongInfo: string | null;
  accountName: string | null;
  accountNumber: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: { name: string; email: string; telegramId: string | null };
  messages: { id: string; content: string; senderId: string | null; isAdmin: boolean; createdAt: string }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Mở", color: "bg-blue-100 text-blue-700", icon: Clock },
  PROCESSING: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: CheckCircle },
  FAILED: { label: "Thất bại", color: "bg-red-100 text-red-700", icon: XCircle },
  ESCALATED: { label: "Chuyển nhân viên", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  CLOSED: { label: "Đóng", color: "bg-slate-100 text-slate-500", icon: XCircle },
};

const RESOLUTION_MAP: Record<string, string> = {
  auto_credit: "✅ Tự cộng credit",
  manual_credit: "✅ Cộng credit thủ công",
  rejected: "❌ Từ chối",
  escalated: "👨‍💼 Chuyển nhân viên",
};

export default function AdminTicketsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    fetchTickets();
  }, [user]);

  async function fetchTickets() {
    try {
      const res = await fetch("/api/admin/tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {} finally { setLoading(false); }
  }

  async function updateTicket(id: string, status: string, resolution?: string) {
    try {
      await fetch(`/api/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      fetchTickets();
      setSelected(null);
    } catch {}
  }

  const filtered = filter === "ALL" ? tickets : tickets.filter(t => t.status === filter);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></a>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">🎫 Quản lý hỗ trợ</h1>
          <p className="text-sm text-slate-400">{tickets.length} phiếu hỗ trợ</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "OPEN", "PROCESSING", "COMPLETED", "FAILED", "ESCALATED", "CLOSED"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === s ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {s === "ALL" ? "Tất cả" : STATUS_MAP[s]?.label || s}
            {s !== "ALL" && <span className="ml-1">({tickets.filter(t => s === "ALL" || t.status === s).length})</span>}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-slate-400">Không có phiếu nào</CardContent></Card>
        ) : filtered.map(ticket => {
          const st = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
          const Icon = st.icon;
          return (
            <Card key={ticket.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelected(ticket)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={st.color}><Icon className="w-3 h-3 mr-1" />{st.label}</Badge>
                      {ticket.reference && <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{ticket.reference}</code>}
                      {ticket.issueType && <span className="text-xs text-slate-400">{ticket.issueType}</span>}
                    </div>
                    <p className="font-medium text-slate-900 text-sm">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>👤 {ticket.user?.name || ticket.user?.email}</span>
                      {ticket.amount && <span>💰 {Number(ticket.amount).toLocaleString("vi-VN")}đ</span>}
                      <span>🕐 {new Date(ticket.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                  {ticket.resolution && (
                    <Badge className="bg-slate-100 text-slate-600 text-xs">{RESOLUTION_MAP[ticket.resolution] || ticket.resolution}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selected.subject}</CardTitle>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Mã:</span> <code>{selected.id.slice(0, 12)}</code></div>
                <div><span className="text-slate-400">Trạng thái:</span> <Badge className={STATUS_MAP[selected.status]?.color}>{STATUS_MAP[selected.status]?.label}</Badge></div>
                {selected.reference && <div><span className="text-slate-400">Mã CK:</span> <code>{selected.reference}</code></div>}
                {selected.amount && <div><span className="text-slate-400">Số tiền:</span> <b>{Number(selected.amount).toLocaleString("vi-VN")}đ</b></div>}
                {selected.wrongInfo && <div><span className="text-slate-400">Sai:</span> {selected.wrongInfo}</div>}
                {selected.accountName && <div><span className="text-slate-400">Tên CK:</span> {selected.accountName}</div>}
                {selected.accountNumber && <div><span className="text-slate-400">STK:</span> {selected.accountNumber}</div>}
                <div><span className="text-slate-400">User:</span> {selected.user?.name} ({selected.user?.email})</div>
                {selected.user?.telegramId && <div><span className="text-slate-400">Telegram:</span> {selected.user.telegramId}</div>}
              </div>

              {/* Messages */}
              {selected.messages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">💬 Tin nhắn:</h4>
                  {selected.messages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded-lg text-sm ${msg.isAdmin ? "bg-indigo-50 border-l-2 border-indigo-400" : "bg-slate-50"}`}>
                      <span className="text-xs text-slate-400">{msg.isAdmin ? "Bot" : "User"} • {new Date(msg.createdAt).toLocaleTimeString("vi-VN")}</span>
                      <p className="mt-0.5">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap pt-2 border-t">
                {selected.status === "OPEN" && (
                  <>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => updateTicket(selected.id, "COMPLETED", "manual_credit")}>✅ Cộng credit</Button>
                    <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600" onClick={() => updateTicket(selected.id, "PROCESSING")}>⏳ Đang xử lý</Button>
                    <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => updateTicket(selected.id, "FAILED", "rejected")}>❌ Từ chối</Button>
                  </>
                )}
                {selected.status === "PROCESSING" && (
                  <>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => updateTicket(selected.id, "COMPLETED", "manual_credit")}>✅ Hoàn thành</Button>
                    <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => updateTicket(selected.id, "FAILED", "rejected")}>❌ Từ chối</Button>
                  </>
                )}
                {(selected.status === "COMPLETED" || selected.status === "FAILED") && (
                  <Button size="sm" className="bg-slate-500 hover:bg-slate-600" onClick={() => updateTicket(selected.id, "CLOSED")}>🔒 Đóng phiếu</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
