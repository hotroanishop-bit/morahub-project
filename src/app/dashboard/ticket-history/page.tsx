"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, Star } from "lucide-react";
import Link from "next/link";

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

export default function TicketHistoryPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {} finally { setLoading(false); }
  }

  async function rateTicket(id: string, rating: number) {
    try {
      await fetch(`/api/support/tickets/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      fetchTickets();
      setSelected(null);
    } catch {}
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">🎫 Lịch sử hỗ trợ</h1>
          <p className="text-sm text-slate-400">{tickets.length} phiếu đã tạo</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có phiếu hỗ trợ nào</p>
            <Link href="/dashboard/support">
              <Button className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">Tạo phiếu mới</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const st = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
            const Icon = st.icon;
            return (
              <Card key={ticket.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelected(ticket)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={st.color}><Icon className="w-3 h-3 mr-1" />{st.label}</Badge>
                        {ticket.reference && <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{ticket.reference}</code>}
                        {ticket.issueType && <span className="text-xs text-slate-400">{ticket.issueType}</span>}
                      </div>
                      <p className="font-medium text-slate-900 text-sm">{ticket.subject}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        {ticket.amount && <span>💰 {Number(ticket.amount).toLocaleString("vi-VN")}đ</span>}
                        <span>🕐 {new Date(ticket.createdAt).toLocaleString("vi-VN")}</span>
                        {ticket.resolvedAt && <span>✅ {new Date(ticket.resolvedAt).toLocaleString("vi-VN")}</span>}
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
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Phiếu #{selected.id.slice(0, 12)}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Trạng thái:</span> <Badge className={STATUS_MAP[selected.status]?.color}>{STATUS_MAP[selected.status]?.label}</Badge></div>
                {selected.resolution && <div><span className="text-slate-400">Kết quả:</span> {RESOLUTION_MAP[selected.resolution]}</div>}
                {selected.reference && <div><span className="text-slate-400">Mã CK:</span> <code>{selected.reference}</code></div>}
                {selected.amount && <div><span className="text-slate-400">Số tiền:</span> <b>{Number(selected.amount).toLocaleString("vi-VN")}đ</b></div>}
                {selected.wrongInfo && <div><span className="text-slate-400">Sai:</span> {selected.wrongInfo}</div>}
                {selected.accountName && <div><span className="text-slate-400">Tên CK:</span> {selected.accountName}</div>}
                {selected.accountNumber && <div><span className="text-slate-400">STK:</span> {selected.accountNumber}</div>}
              </div>

              {/* Messages */}
              {selected.messages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">💬 Tin nhắn:</h4>
                  {selected.messages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded-lg text-sm ${msg.isAdmin ? "bg-indigo-50 border-l-2 border-indigo-400" : "bg-slate-50"}`}>
                      <span className="text-xs text-slate-400">{msg.isAdmin ? "Bot/Admin" : "Bạn"} • {new Date(msg.createdAt).toLocaleTimeString("vi-VN")}</span>
                      <p className="mt-0.5">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Rating */}
              {selected.status === "COMPLETED" && !selected.messages.find(m => m.content.startsWith("RATING:")) && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-slate-600 mb-2">Đánh giá phiếu hỗ trợ:</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => rateTicket(selected.id, star)}
                        className="text-2xl hover:scale-110 transition text-yellow-400">
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Link href="/dashboard/support">
                  <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">💬 Tạo phiếu mới</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
