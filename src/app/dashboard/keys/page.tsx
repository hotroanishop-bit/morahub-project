"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Plus, Trash2, Copy, Check, RefreshCw, Eye, EyeOff, BarChart3, Zap, Clock, ArrowLeft, ExternalLink } from "lucide-react";

interface ApiKey { id: string; name: string; key: string; isActive: boolean; totalCalls: number; totalTokens: number; lastUsedAt: string | null; lastModel: string | null; recentCalls: number; recentCost: number; expiresAt: string | null }
interface KeyUsage { key: any; usage: any; byDay: any[]; byModel: any[] }

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [keyExpiry, setKeyExpiry] = useState("none");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyUsage, setKeyUsage] = useState<KeyUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  function fetchKeys() {
    fetch("/api/keys/usage").then(r => r.json()).then(d => setKeys(d.keys || [])).catch(() => {}).finally(() => setLoading(false));
  }

  function toggleVisibility(id: string) {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success("Đã copy API key!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function createKey() {
    if (!newName.trim()) { toast.error("Nhập tên key"); return; }
    setCreating(true);
    let expiresAt = null;
    if (keyExpiry === "30d") expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    else if (keyExpiry === "90d") expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    else if (keyExpiry === "1y") expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, expiresAt }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setKeys(prev => [{ ...data, recentCalls: 0, recentCost: 0 }, ...prev]);
      setNewName("");
      setShowCreate(false);
      toast.success("Tạo key thành công!");
    } catch {
      toast.error("Lỗi tạo key");
    } finally {
      setCreating(false);
    }
  }

  async function toggleKey(id: string) {
    const res = await fetch(`/api/keys/${id}/toggle`, { method: "POST" });
    const data = await res.json();
    setKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: data.isActive } : k));
    toast.success(data.isActive ? "Đã kích hoạt" : "Đã vô hiệu hóa");
  }

  async function deleteKey(id: string) {
    if (!confirm("Xóa vĩnh viễn API key này?")) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success("Đã xóa!");
  }

  async function viewUsage(keyId: string) {
    setSelectedKey(keyId);
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/keys/usage?keyId=${keyId}`);
      const data = await res.json();
      setKeyUsage(data);
    } catch {} finally {
      setUsageLoading(false);
    }
  }

  function maskKey(key: string) {
    return key.slice(0, 10) + "••••••••" + key.slice(-6);
  }

  if (selectedKey && keyUsage) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <button onClick={() => { setSelectedKey(null); setKeyUsage(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại API Keys
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-bold text-slate-900 text-lg">{keyUsage.key.name}</h2>
          <code className="text-xs font-mono text-slate-500">{keyUsage.key.key}</code>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Tổng Calls</div>
            <div className="text-xl font-extrabold text-slate-900">{keyUsage.usage.totalCalls.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Tokens In</div>
            <div className="text-xl font-extrabold text-indigo-600">{keyUsage.usage.totalTokensIn.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Tokens Out</div>
            <div className="text-xl font-extrabold text-emerald-600">{keyUsage.usage.totalTokensOut.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Tổng Chi Phí</div>
            <div className="text-xl font-extrabold text-amber-600">${keyUsage.usage.totalCost.toFixed(4)}</div>
          </div>
        </div>

        {keyUsage.byModel.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Theo Model</h3>
            <div className="space-y-2">
              {keyUsage.byModel.map((m: any) => (
                <div key={m.model} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{m.model}</span>
                  <span className="text-xs text-slate-500">{m.calls} calls · ${m.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">API Keys</h1>
          <p className="text-slate-500 mt-1 text-sm">Quản lý API keys và theo dõi sử dụng</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Tạo Key Mới
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="flex gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên API key (ví dụ: My App)" onKeyDown={(e) => e.key === "Enter" && createKey()}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
            <select value={keyExpiry} onChange={(e) => setKeyExpiry(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
              <option value="none">Không hết hạn</option>
              <option value="30d">30 ngày</option>
              <option value="90d">90 ngày</option>
              <option value="1y">1 năm</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={createKey} disabled={creating} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
              {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Tạo"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Hủy</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Key className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có API key nào</p>
          <p className="text-xs mt-1">Tạo key để bắt đầu sử dụng</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{k.name}</h3>
                    <Badge className={`text-[10px] ${k.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {k.isActive ? "Active" : "Disabled"}
                    </Badge>
                    {k.expiresAt && (
                      <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        HSD: {new Date(k.expiresAt).toLocaleDateString("vi-VN")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-xs font-mono text-slate-500">
                      {visibleKeys.has(k.id) ? k.key : maskKey(k.key)}
                    </code>
                    <button onClick={() => toggleVisibility(k.id)} className="text-slate-400 hover:text-slate-600">
                      {visibleKeys.has(k.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copyKey(k.key, k.id)} className="text-slate-400 hover:text-indigo-500">
                      {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Usage stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {k.totalCalls.toLocaleString()} calls</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {(k.totalTokens / 1000).toFixed(1)}K tokens</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("vi-VN") : "Chưa dùng"}</span>
                    {k.lastModel && <span className="text-indigo-500 font-medium">{k.lastModel}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => viewUsage(k.id)} className="text-xs rounded-lg border-slate-200">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleKey(k.id)} className={`text-xs rounded-lg ${k.isActive ? "border-amber-200 text-amber-600" : "border-emerald-200 text-emerald-600"}`}>
                    {k.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteKey(k.id)} className="text-xs rounded-lg border-red-200 text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
