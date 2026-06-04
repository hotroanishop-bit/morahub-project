"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Webhook, Plus, Trash2, Check, X, Send } from "lucide-react";

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

const availableEvents = [
  { value: "deposit.success", label: "💰 Nạp tiền thành công" },
  { value: "deposit.failed", label: "❌ Nạp tiền thất bại" },
  { value: "ticket.created", label: "🎫 Ticket mới" },
  { value: "ticket.replied", label: "💬 Ticket có reply" },
  { value: "key.expiring", label: "🔑 API key sắp hết hạn" },
  { value: "low.balance", label: "⚠️ Số dư thấp" },
];

export default function WebhooksPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch {} finally { setLoading(false); }
  }

  async function createWebhook() {
    try {
      await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      setShowCreate(false);
      setNewUrl("");
      setNewEvents([]);
      await fetchWebhooks();
    } catch {}
  }

  async function deleteWebhook(id: string) {
    try {
      await fetch("/api/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: id }),
      });
      await fetchWebhooks();
    } catch {}
  }

  async function testWebhook(id: string) {
    setTesting(id);
    try {
      await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: id }),
      });
    } catch {} finally { setTesting(null); }
  }

  function toggleEvent(event: string) {
    setNewEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">🔔 Webhooks</h1>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <Plus className="w-4 h-4 mr-1" /> Thêm Webhook
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            Webhook sẽ nhận POST request khi có event. Body chứa JSON với thông tin event.
          </p>
        </CardContent>
      </Card>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Tạo Webhook mới</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder="https://your-server.com/webhook" className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
            <div>
              <p className="text-xs text-slate-500 mb-2">Events:</p>
              <div className="space-y-1">
                {availableEvents.map(ev => (
                  <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newEvents.includes(ev.value)} onChange={() => toggleEvent(ev.value)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-500" />
                    <span className="text-sm">{ev.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createWebhook} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white" disabled={!newUrl || newEvents.length === 0}>Tạo</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Webhook className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có webhook nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(w => (
            <Card key={w.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <code className="text-sm font-mono text-slate-700 break-all">{w.url}</code>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {w.events.map(e => (
                        <span key={e} className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">{e}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => testWebhook(w.id)} size="sm" variant="outline" className="text-[10px] h-6" disabled={testing === w.id}>
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button onClick={() => deleteWebhook(w.id)} size="sm" variant="outline" className="text-[10px] h-6 text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Tạo: {new Date(w.createdAt).toLocaleDateString("vi-VN")}
                  
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
