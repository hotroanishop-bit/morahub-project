"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Headphones, Plus, Send, ArrowLeft, Clock, CheckCircle, MessageCircle, AlertTriangle } from "lucide-react";

interface TicketMessage { id: string; content: string; isAdmin: boolean; senderId: string | null; createdAt: string; sender?: { id: string; name: string; role: string } }
interface Ticket { id: string; subject: string; status: string; priority: string; category: string; createdAt: string; updatedAt: string; messages: TicketMessage[] }

const CATEGORIES = [
  { id: "general", label: "General", icon: "💬" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "technical", label: "Technical", icon: "🔧" },
  { id: "feature", label: "Feature Request", icon: "💡" },
];

const PRIORITIES = [
  { id: "low", label: "Low", color: "bg-slate-50 text-slate-600 border-slate-200" },
  { id: "normal", label: "Normal", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { id: "high", label: "High", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { id: "urgent", label: "Urgent", color: "bg-red-50 text-red-600 border-red-200" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Mới", color: "bg-blue-100 text-blue-700" },
  REPLYING: { label: "Đang chat", color: "bg-amber-100 text-amber-700" },
  RESOLVED: { label: "Đã giải quyết", color: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Đã đóng", color: "bg-slate-100 text-slate-500" },
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [creating, setCreating] = useState(false);

  // Chat view
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [chatMessages, setChatMessages] = useState<TicketMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Poll for new messages every 5s when chat is open
  useEffect(() => {
    if (!activeTicket) return;
    const interval = setInterval(() => loadChat(activeTicket.id, true), 5000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  async function fetchTickets() {
    setLoading(true);
    const res = await fetch("/api/tickets");
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }

  async function createTicket() {
    if (!subject.trim() || !message.trim()) { toast.error("Vui lòng nhập đầy đủ"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), category, priority }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Tạo ticket thành công!");
        setShowCreate(false); setSubject(""); setMessage("");
        fetchTickets();
        if (data.ticket) openChat(data.ticket);
      } else {
        const d = await res.json();
        toast.error(d.error || "Lỗi");
      }
    } catch { toast.error("Lỗi kết nối"); }
    setCreating(false);
  }

  async function openChat(ticket: Ticket) {
    setActiveTicket(ticket);
    setLoadingChat(true);
    await loadChat(ticket.id);
    setLoadingChat(false);
  }

  async function loadChat(ticketId: string, silent = false) {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
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

    // Optimistic add
    const tempMsg: TicketMessage = {
      id: "temp-" + Date.now(),
      content,
      isAdmin: false,
      senderId: null,
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
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

  async function closeTicket(id: string) {
    await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED" }) });
    toast.success("Đã đóng ticket");
    setActiveTicket(null);
    fetchTickets();
  }

  // Chat view
  if (activeTicket) {
    const st = statusConfig[activeTicket.status] || statusConfig.OPEN;
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Chat header */}
        <div className="bg-white rounded-t-2xl border border-slate-100 border-b-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveTicket(null); fetchTickets(); }} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h2 className="font-bold text-slate-900">{activeTicket.subject}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                <span className="text-[10px] text-slate-400">{activeTicket.category}</span>
              </div>
            </div>
          </div>
          {activeTicket.status !== "CLOSED" && (
            <Button variant="outline" size="sm" onClick={() => closeTicket(activeTicket.id)} className="text-xs rounded-lg border-red-200 text-red-500 hover:bg-red-50">
              Đóng ticket
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white border-x border-slate-100 p-4 space-y-3">
          {loadingChat ? (
            <div className="text-center py-8 text-slate-400 text-sm">Đang tải...</div>
          ) : chatMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Chưa có tin nhắn</div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.isAdmin ? "bg-slate-100 text-slate-800" : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                }`}>
                  {msg.isAdmin && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-[8px] text-white font-bold">A</div>
                      <span className="text-[10px] font-semibold text-slate-500">Admin</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className={`text-[10px] mt-1 ${msg.isAdmin ? "text-slate-400" : "text-white/60"}`}>
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
                placeholder="Nhập tin nhắn..." disabled={sending}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50" />
              <Button onClick={sendMessage} disabled={sending || !chatInput.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl px-4">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Ticket list
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Hỗ Trợ</h1>
          <p className="text-slate-500 mt-1 text-sm">Chat trực tiếp với admin</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Ticket Mới
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Tạo Ticket Mới</h3>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tiêu đề</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mô tả ngắn gọn vấn đề..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Danh mục</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Ưu tiên</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nội dung</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Mô tả chi tiết vấn đề..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none" />
          </div>
          <div className="flex gap-2">
            <Button onClick={createTicket} disabled={creating} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
              {creating ? "Đang tạo..." : "Tạo & Bắt Đầu Chat"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Hủy</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Headphones className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có ticket nào</p>
          <p className="text-xs mt-1">Tạo ticket để chat với admin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const st = statusConfig[t.status] || statusConfig.OPEN;
            const lastMsg = t.messages?.[0];
            return (
              <button key={t.id} onClick={() => openChat(t)}
                className="w-full bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 truncate">{t.subject}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    {lastMsg && (
                      <p className="text-sm text-slate-500 mt-1 truncate">{lastMsg.isAdmin ? "👤 " : "💬 "}{lastMsg.content}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>{new Date(t.updatedAt).toLocaleString("vi-VN")}</span>
                      <span>{t.messages?.length || 0} tin nhắn</span>
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
