"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Save, X, Cpu } from "lucide-react";

interface AiModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  pricePer1kIn: number;
  pricePer1kOut: number;
  contextWindow: number;
  maxTokens: number;
  isActive: boolean;
}

export default function AdminModelsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [models, setModels] = useState<AiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", displayName: "", provider: "openai", pricePer1kIn: "0", pricePer1kOut: "0", contextWindow: "4096", maxTokens: "4096" });

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchModels();
  }, [user]);

  async function fetchModels() {
    try {
      const res = await fetch("/api/admin/models");
      const data = await res.json();
      setModels(data.models || []);
    } catch {} finally { setLoading(false); }
  }

  async function saveModel() {
    try {
      if (editing) {
        await fetch("/api/admin/models", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editing }),
        });
      } else {
        await fetch("/api/admin/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ name: "", displayName: "", provider: "openai", pricePer1kIn: "0", pricePer1kOut: "0", contextWindow: "4096", maxTokens: "4096" });
      await fetchModels();
    } catch {}
  }

  async function deleteModel(id: string) {
    if (!confirm("Xóa model này?")) return;
    try {
      await fetch("/api/admin/models", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchModels();
    } catch {}
  }

  function startEdit(model: AiModel) {
    setForm({
      name: model.name,
      displayName: model.displayName,
      provider: model.provider,
      pricePer1kIn: String(model.pricePer1kIn),
      pricePer1kOut: String(model.pricePer1kOut),
      contextWindow: String(model.contextWindow),
      maxTokens: String(model.maxTokens),
    });
    setEditing(model.id);
    setShowCreate(true);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">🤖 Quản lý Models</h1>
        <Button onClick={() => { setShowCreate(true); setEditing(null); }} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Thêm Model
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{editing ? "Sửa Model" : "Thêm Model mới"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Internal name (gpt-4o)"
                className="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              <input type="text" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Display name (GPT-4o)"
                className="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
            </div>
            <select value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="deepseek">DeepSeek</option>
              <option value="mistral">Mistral</option>
              <option value="other">Other</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Price per 1K input tokens (đ)</label>
                <input type="number" value={form.pricePer1kIn} onChange={e => setForm(p => ({ ...p, pricePer1kIn: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Price per 1K output tokens (đ)</label>
                <input type="number" value={form.pricePer1kOut} onChange={e => setForm(p => ({ ...p, pricePer1kOut: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Context Window</label>
                <input type="number" value={form.contextWindow} onChange={e => setForm(p => ({ ...p, contextWindow: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Output Tokens</label>
                <input type="number" value={form.maxTokens} onChange={e => setForm(p => ({ ...p, maxTokens: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveModel} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <Save className="w-4 h-4 mr-1" /> {editing ? "Lưu" : "Tạo"}
              </Button>
              <Button onClick={() => { setShowCreate(false); setEditing(null); }} variant="outline"><X className="w-4 h-4 mr-1" /> Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Model</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Provider</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Input/1K</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Output/1K</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Context</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map(m => (
                  <tr key={m.id} className="border-b hover:bg-slate-50 transition">
                    <td className="p-3">
                      <p className="text-sm font-medium text-slate-800">{m.displayName || m.name}</p>
                      <p className="text-xs text-slate-400">{m.name}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-600">{m.provider}</td>
                    <td className="p-3 text-sm text-slate-800">{Number(m.pricePer1kIn).toLocaleString("vi-VN")}đ</td>
                    <td className="p-3 text-sm text-slate-800">{Number(m.pricePer1kOut).toLocaleString("vi-VN")}đ</td>
                    <td className="p-3 text-sm text-slate-600">{m.contextWindow?.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button onClick={() => startEdit(m)} size="sm" variant="outline" className="text-[10px] h-6"><Edit2 className="w-3 h-3" /></Button>
                        <Button onClick={() => deleteModel(m.id)} size="sm" variant="outline" className="text-[10px] h-6 text-red-600"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
