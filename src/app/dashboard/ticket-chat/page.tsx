"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Star, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
  isAdmin: boolean;
}

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

const statusIcons: Record<string, any> = {
  OPEN: Clock,
  IN_PROGRESS: AlertTriangle,
  RESOLVED: CheckCircle2,
  CLOSED: XCircle,
};

export default function TicketChatPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id);
    }
  }, [selectedTicket?.id]);

  async function fetchTickets() {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {} finally { setLoading(false); }
  }

  async function fetchTicketMessages(ticketId: string) {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      const data = await res.json();
      setSelectedTicket(data.ticket || data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {}
  }

  async function sendMessage() {
    if (!selectedTicket || !newMessage.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      setNewMessage("");
      await fetchTicketMessages(selectedTicket.id);
    } catch {} finally { setSending(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Ticket List */}
      <div className="w-80 flex-shrink-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="p-3 border-b">
            <CardTitle className="text-sm">🎫 Tickets ({tickets.length})</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto">
            {tickets.map(t => {
              const Icon = statusIcons[t.status] || Clock;
              return (
                <div key={t.id} onClick={() => setSelectedTicket(t)}
                  className={`p-3 border-b cursor-pointer hover:bg-slate-50 transition ${selectedTicket?.id === t.id ? "bg-indigo-50" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-slate-400">#{t.id.slice(-8)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || ""}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{t.subject}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Icon className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400">{t.status} • {new Date(t.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        <Card className="h-full flex flex-col">
          {selectedTicket ? (
            <>
              {/* Header */}
              <CardHeader className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{selectedTicket.subject}</CardTitle>
                    <span className="text-xs text-slate-400">#{selectedTicket.id.slice(-8)}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[selectedTicket.priority] || ""}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket.messages?.map(m => (
                  <div key={m.id} className={`flex ${m.isAdmin ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${m.isAdmin ? "bg-slate-100 text-slate-800" : "bg-indigo-500 text-white"}`}>
                      <p className="text-sm">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${m.isAdmin ? "text-slate-400" : "text-indigo-200"}`}>
                        {new Date(m.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full text-slate-400">
              <p>Chọn ticket để xem chi tiết</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
