"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Plus, Trash2, RefreshCw, Clock, AlertTriangle, Copy, Check } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  expiresAt: string;
  lastUsedAt: string;
  totalCalls: number;
  createdAt: string;
  active: boolean;
}

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState("30");
  const [copied, setCopied] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {} finally { setLoading(false); }
  }

  async function createKey() {
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, expiresInDays: parseInt(newExpiry) }),
      });
      const data = await res.json();
      if (data.key) {
        setCreatedKey(data.key);
        setNewName("");
        setShowCreate(false);
        await fetchKeys();
      }
    } catch {}
  }

  async function deleteKey(id: string) {
    try {
      await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: id }),
      });
      await fetchKeys();
    } catch {}
  }

  async function rotateKey(id: string) {
    try {
      const res = await fetch("/api/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: id }),
      });
      const data = await res.json();
      if (data.key) {
        setCreatedKey(data.key);
        await fetchKeys();
      }
    } catch {}
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function isExpiringSoon(expiresAt: string) {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">🔑 API Keys</h1>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Tạo Key
        </Button>
      </div>

      {/* Created Key Alert */}
      {createdKey && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-800 mb-2">✅ Key đã tạo! Lưu lại ngay (sẽ không hiển thị lại):</p>
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
              <code className="flex-1 text-sm font-mono break-all">{createdKey}</code>
              <button onClick={() => copyKey(createdKey)} className="text-slate-400 hover:text-slate-600">
                {copied === createdKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tạo API Key mới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Tên key (ví dụ: Production, Development)" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            <select value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
              <option value="7">7 ngày</option>
              <option value="30">30 ngày</option>
              <option value="90">90 ngày</option>
              <option value="365">1 năm</option>
              <option value="0">Không hết hạn</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={createKey} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white" disabled={!newName}>Tạo</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key List */}
      {keys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có API key nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <Card key={k.id} className={isExpiringSoon(k.expiresAt) ? "border-orange-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{k.name}</span>
                      {!k.active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Đã vô hiệu</span>}
                      {isExpiringSoon(k.expiresAt) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Sắp hết hạn</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{k.key.slice(0, 12)}...{k.key.slice(-4)}</span>
                      {k.expiresAt && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(k.expiresAt).toLocaleDateString("vi-VN")}</span>}
                      <span>{k.totalCalls || 0} calls</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => rotateKey(k.id)} size="sm" variant="outline" className="text-[10px] h-6" title="Rotate key">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button onClick={() => deleteKey(k.id)} size="sm" variant="outline" className="text-[10px] h-6 text-red-600" title="Xóa key">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
