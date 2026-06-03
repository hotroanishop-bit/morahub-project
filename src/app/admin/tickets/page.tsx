"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Headphones, MessageCircle, Clock, CheckCircle, AlertTriangle, Send, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

interface TicketMessage { id: string; content: string; isAdmin: boolean; senderId: string | null; createdAt: string; sender?: { id: string; name: string; email: string; role: string } }
interface Ticket { id: string; subject: string; status: string; priority: string; category: string; createdAt: string; updatedAt: string; user: { name: string | null; email: string }; messages?: TicketMessage[] }

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Mới", color: "bg-blue-100 text-blue-700" },
  REPLYING: { label: "Đang chat", color: "bg-amber-100 text-amber-700" },
  RESOLVED: { label: "Đã giải quyết", color: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Đã đóng", color: "bg-slate-100 text-slate-500" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-slate-500" },
  normal: { label: "Normal", color: "text-blue-500" },
  high: { label: "High", color: "text-amber-500" },
  urgent: { label: "Urgent", color: "text-red-500" },
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Chat
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [chatMessages, setChatMessages] = useState<TicketMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => {
    if (!activeTicket) return;
    const interval = setInterval(() => loadChat(activeTicket.id, true), 5000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  async function fetchTickets() {
    setLoading(true);
    const res = await fetch("/api/admin/tickets");
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }

  async function openChat(ticket: Ticket) {
    setActiveTicket(ticket);
    setLoadingChat(true);
    await loadChat(ticket.id);
    setLoadingChat(false);
  }

  async function loadChat(ticketId: string, silent = false) {
    try {
      // Admin uses same ticket API but without userId check
      const res = await fetch(`/api/admin/tickets/${ticketId}`);
      if (!res.ok) return;
      const data = await res.json();
      setChatMessages(data.messages || []);
      if (data.ticket) setActiveTicket(data.ticket);
    } catch {}
  }

  async function sendMessage() {
    if (!chatInput.trim() || !activeTicket || sending) return;
    const content = chatInput.trim();
    setChatInput("");
    setSending(true);

    const tempMsg: TicketMessage = {
      id: "temp-" + Date.now(),
      content,
      isAdmin: true,
      senderId: null,
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/admin/tickets/${activeTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: content }),
      });
      if (res.ok) {
        const data = await res.json();
        // Reload to get proper message
        await loadChat(activeTicket.id);
      } else {
        setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        toast.error("Gửi thất bại");
      }
    } catch {
      setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      toast.error("Lỗi kết nối");
    }
    setSending(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/tickets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Đã cập nhật");
    fetchTickets();
    if (activeTicket?.id === id) setActiveTicket(prev => prev ? { ...prev, status } : null);
  }

  const filtered = tickets.filter(t => {
    if (filter !== "ALL" && t.status !== filter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.user.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Chat view
  if (activeTicket) {
    const st = statusConfig[activeTicket.status] || statusConfig.OPEN;
    const pr = priorityConfig[activeTicket.priority] || priorityConfig.normal;
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-slate-100 border-b-0 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => { setActiveTicket(null); fetchTickets(); }} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h2 className="font-bold text-slate-900">{activeTicket.subject}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  <span className={`text-[10px] font-semibold ${pr.color}`}>{pr.label}</span>
                  <span className="text-[10px] text-slate-400">{activeTicket.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-2">
                <div className="text-xs font-semibold text-slate-700">{activeTicket.user.name || "User"}</div>
                <div className="text-[10px] text-slate-400">{activeTicket.user.email}</div>
              </div>
              <div className="flex gap-1">
                {activeTicket.status !== "RESOLVED" && (
                  <Button variant="outline" size="sm" onClick={() => updateStatus(activeTicket.id, "RESOLVED")} className="text-xs rounded-lg border-emerald-200 text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Giải quyết
                  </Button>
                )}
                {activeTicket.status !== "CLOSED" && (
                  <Button variant="outline" size="sm" onClick={() => updateStatus(activeTicket.id, "CLOSED")} className="text-xs rounded-lg border-red-200 text-red-500">
                    Đóng
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white border-x border-slate-100 p-4 space-y-3">
          {loadingChat ? (
            <div className="text-center py-8 text-slate-400 text-sm">Đang tải...</div>
          ) : chatMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Chưa có tin nhắn</div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.isAdmin ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-slate-100 text-slate-800"
                }`}>
                  {!msg.isAdmin && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold">U</div>
                      <span className="text-[10px] font-semibold text-slate-500">{msg.sender?.name || "User"}</span>
                    </div>
                  )}
                  {msg.isAdmin && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-semibold text-white/80">Admin</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className={`text-[10px] mt-1 ${msg.isAdmin ? "text-white/60" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeTicket.status !== "CLOSED" && (
          <div className="bg-white rounded-b-2xl border border-slate-100 border-t-0 p-3">
            <div className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Nhập phản hồi..." disabled={sending}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-50" />
              <Button onClick={sendMessage} disabled={sending || !chatInput.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-4">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Tickets</h1>
        <p className="text-slate-500 mt-1 text-sm">Quản lý hỗ trợ khách hàng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm ticket..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="flex gap-1.5">
          {[{ id: "ALL", label: "Tất cả" }, { id: "OPEN", label: "Mới" }, { id: "REPLYING", label: "Đang xử lý" }, { id: "RESOLVED", label: "Đã giải quyết" }, { id: "CLOSED", label: "Đã đóng" }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === f.id ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Headphones className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có ticket nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const st = statusConfig[t.status] || statusConfig.OPEN;
            const pr = priorityConfig[t.priority] || priorityConfig.normal;
            return (
              <button key={t.id} onClick={() => openChat(t)}
                className="w-full bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{t.subject}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      <span className={`text-[10px] font-semibold ${pr.color}`}>●</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.user.name || t.user.email}</span>
                      <span>{t.category}</span>
                      <span>{new Date(t.updatedAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-slate-300 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
