"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Plus, Trash2, Power, PowerOff, Eye, EyeOff, Copy, RotateCcw, Search } from "lucide-react";

interface ApiKey { id: string; name: string; key: string; isActive: boolean; rateLimit: number | null; totalCalls: number; totalTokens: number; lastModel: string | null; expiresAt: string | null; createdAt: string }

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRateLimit, setNewRateLimit] = useState("30");
  const [newExpiry, setNewExpiry] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchKeys(); }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/admin/keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch { toast.error("Lỗi tải keys"); }
    setLoading(false);
  }

  async function createKey() {
    if (!newName.trim()) { toast.error("Nhập tên key"); return; }
    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, rateLimit: parseInt(newRateLimit) || 30, expiresAt: newExpiry || null }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success("Đã tạo key!");
      setKeys((prev) => [{ ...data.key, totalCalls: 0, totalTokens: 0 }, ...prev]);
      setShowAdd(false);
      setNewName("");
      setShowKeys((prev) => ({ ...prev, [data.key.id]: true }));
    } else {
      const data = await res.json();
      toast.error(data.error || "Lỗi");
    }
  }

  async function toggleKey(k: ApiKey) {
    const res = await fetch("/api/admin/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId: k.id, isActive: !k.isActive }),
    });
    if (res.ok) {
      setKeys((prev) => prev.map((x) => (x.id === k.id ? { ...x, isActive: !x.isActive } : x)));
      toast.success(`${k.name} ${k.isActive ? "tắt" : "bật"}`);
    }
  }

  async function deleteKey(k: ApiKey) {
    if (!confirm(`Xác nhận xóa key "${k.name}"?`)) return;
    const res = await fetch("/api/admin/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId: k.id }),
    });
    if (res.ok) {
      setKeys((prev) => prev.filter((x) => x.id !== k.id));
      toast.success("Đã xóa key!");
    }
  }

  async function regenerateKey(k: ApiKey) {
    if (!confirm(`Tạo lại key "${k.name}"? Key cũ sẽ ngừng hoạt động.`)) return;
    const res = await fetch(`/api/keys/${k.id}/regenerate`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setKeys((prev) => prev.map((x) => (x.id === k.id ? { ...x, key: data.key.key } : x)));
      setShowKeys((prev) => ({ ...prev, [k.id]: true }));
      toast.success("Đã tạo lại key!");
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Đã copy key!");
  }

  const filtered = keys.filter((k) => !search || k.name.toLowerCase().includes(search.toLowerCase()) || k.key.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">API Keys</h1>
          <p className="text-slate-500 mt-1 text-sm">{keys.length} keys</p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Tìm..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full lg:w-48 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm">
            <Plus className="w-4 h-4 mr-1" />Tạo Key
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-lg">
          <h3 className="font-bold text-slate-900 mb-4">Tạo API Key Mới</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label className="text-slate-700 text-sm">Tên key</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My App Key" className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Rate Limit (req/phút)</Label><Input type="number" value={newRateLimit} onChange={(e) => setNewRateLimit(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Hết hạn (tùy chọn)</Label><Input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={createKey} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">Tạo Key</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Không có key nào</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((k) => (
              <div key={k.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{k.name}</span>
                      <Badge className={`${k.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"} text-[10px]`}>{k.isActive ? "Active" : "Disabled"}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {showKeys[k.id] ? k.key : k.key.slice(0, 8) + "••••••••••••" + k.key.slice(-4)}
                      </code>
                      <button onClick={() => setShowKeys((prev) => ({ ...prev, [k.id]: !prev[k.id] }))} className="text-slate-400 hover:text-indigo-500 p-1">{showKeys[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => copyKey(k.key)} className="text-slate-400 hover:text-indigo-500 p-1"><Copy className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 flex-wrap">
                      <span>{k.totalCalls} calls</span>
                      <span>{k.totalTokens.toLocaleString()} tokens</span>
                      {k.rateLimit && <span>{k.rateLimit} req/phút</span>}
                      {k.lastModel && <span>Last: {k.lastModel}</span>}
                      {k.expiresAt && <span>Hết hạn: {new Date(k.expiresAt).toLocaleDateString("vi-VN")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => regenerateKey(k)} className="text-slate-400 hover:text-amber-500 p-1.5 rounded-lg hover:bg-amber-50" title="Regenerate"><RotateCcw className="w-4 h-4" /></button>
                    <button onClick={() => toggleKey(k)} className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${k.isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>{k.isActive ? "Bật" : "Tắt"}</button>
                    <button onClick={() => deleteKey(k)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
