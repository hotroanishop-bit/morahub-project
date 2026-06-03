"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Webhook, Plus, Trash2, ExternalLink, Copy, Check, Zap, Activity, CreditCard, Key, Headphones } from "lucide-react";

interface WebhookItem { id: string; url: string; events: string; isActive: boolean; createdAt: string }

const EVENT_OPTIONS = [
  { value: "usage.created", label: "Usage Created", icon: Activity, color: "bg-blue-50 text-blue-700" },
  { value: "key.created", label: "Key Created", icon: Key, color: "bg-emerald-50 text-emerald-700" },
  { value: "key.revoked", label: "Key Revoked", icon: Key, color: "bg-red-50 text-red-700" },
  { value: "key.expired", label: "Key Expired", icon: Key, color: "bg-amber-50 text-amber-700" },
  { value: "credit.low", label: "Low Credit", icon: CreditCard, color: "bg-orange-50 text-orange-700" },
  { value: "credit.depleted", label: "Credit Depleted", icon: CreditCard, color: "bg-red-50 text-red-700" },
  { value: "ticket.created", label: "Ticket Created", icon: Headphones, color: "bg-purple-50 text-purple-700" },
  { value: "ticket.replied", label: "Ticket Replied", icon: Headphones, color: "bg-indigo-50 text-indigo-700" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/webhooks").then(r => r.json()).then(d => setWebhooks(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function createWebhook() {
    if (!url.trim()) { toast.error("Nhập URL"); return; }
    if (selectedEvents.length === 0) { toast.error("Chọn ít nhất 1 event"); return; }

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: selectedEvents }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      setWebhooks(prev => [data, ...prev]);
      setCreatedSecret(data.secret);
      setShowForm(false);
      setUrl("");
      setSelectedEvents([]);
      toast.success("Tạo webhook thành công!");
    } catch {
      toast.error("Lỗi tạo webhook");
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Xóa webhook này?")) return;
    await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast.success("Đã xóa!");
  }

  function toggleEvent(event: string) {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  }

  function copySecret() {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopiedId("secret");
      toast.success("Đã copy secret!");
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Webhooks</h1>
          <p className="text-slate-500 mt-1 text-sm">Nhận thông báo real-time khi sự kiện xảy ra</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Thêm Webhook
        </Button>
      </div>

      {/* Created secret alert */}
      {createdSecret && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Lưu Secret Key!</p>
              <p className="text-xs text-amber-600 mt-1">Đây là lần duy nhất bạn thấy secret này. Copy và lưu lại.</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="bg-white px-3 py-1 rounded-lg text-xs font-mono text-amber-800 border border-amber-200">{createdSecret}</code>
                <button onClick={copySecret} className="text-amber-600 hover:text-amber-800">
                  {copiedId === "secret" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={() => setCreatedSecret(null)} className="text-amber-400 hover:text-amber-600">×</button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Tạo Webhook Mới</h3>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Endpoint URL</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Events</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <button key={ev.value} onClick={() => toggleEvent(ev.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedEvents.includes(ev.value) ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}>
                  <ev.icon className="w-3.5 h-3.5" /> {ev.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={createWebhook} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">Tạo</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Hủy</Button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Webhook className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có webhook nào</p>
          <p className="text-xs mt-1">Tạo webhook để nhận thông báo real-time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                    <code className="text-sm font-mono text-slate-700 truncate">{wh.url}</code>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {wh.events.split(",").map((ev) => {
                      const opt = EVENT_OPTIONS.find(e => e.value === ev);
                      return (
                        <span key={ev} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt?.color || "bg-slate-100 text-slate-600"}`}>
                          {opt?.label || ev}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => deleteWebhook(wh.id)} className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
