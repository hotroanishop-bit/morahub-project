"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Cpu, Search, Plus, Edit2, Trash2, DollarSign } from "lucide-react";

interface Model { id: string; name: string; displayName: string; provider: string; pricePer1kIn: string; pricePer1kOut: string; maxTokens: number; contextWindow: number; isActive: boolean; description: string | null }

const providerColors: Record<string, string> = {
  OPENAI: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ANTHROPIC: "bg-orange-50 text-orange-700 border-orange-200",
  GOOGLE: "bg-blue-50 text-blue-700 border-blue-200",
  DEEPSEEK: "bg-violet-50 text-violet-700 border-violet-200",
  MISTRAL: "bg-orange-50 text-orange-700 border-orange-200",
  ALIBABA: "bg-pink-50 text-pink-700 border-pink-200",
  ZHIPU: "bg-purple-50 text-purple-700 border-purple-200",
  XAI: "bg-slate-50 text-slate-700 border-slate-200",
  MOONSHOT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  META: "bg-sky-50 text-sky-700 border-sky-200",
  MINIMAX: "bg-teal-50 text-teal-700 border-teal-200",
};

const providerLogos: Record<string, string> = {
  OPENAI: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/openai.svg",
  ANTHROPIC: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/claude-ai.svg",
  GOOGLE: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-gemini.svg",
  DEEPSEEK: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/deepseek.svg",
  MISTRAL: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/mistral-ai.svg",
  ALIBABA: "/logos/qwen.svg",
  ZHIPU: "/logos/glm.svg",
  XAI: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/grok.svg",
  MOONSHOT: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/kimi-ai.svg",
  META: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/meta.svg",
  MINIMAX: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/minimax.svg",
};

const providerBg: Record<string, string> = {
  OPENAI: "bg-white",
  ANTHROPIC: "bg-white",
  GOOGLE: "bg-white",
  DEEPSEEK: "bg-white",
  MISTRAL: "bg-white",
  ALIBABA: "bg-white",
  ZHIPU: "bg-white",
  XAI: "bg-white",
  MOONSHOT: "bg-white",
  META: "bg-white",
};

const providerOptions = [
  { value: "OPENAI", label: "OpenAI", logo: providerLogos.OPENAI },
  { value: "ANTHROPIC", label: "Anthropic (Claude)", logo: providerLogos.ANTHROPIC },
  { value: "GOOGLE", label: "Google (Gemini)", logo: providerLogos.GOOGLE },
  { value: "DEEPSEEK", label: "DeepSeek", logo: providerLogos.DEEPSEEK },
  { value: "MISTRAL", label: "Mistral AI", logo: providerLogos.MISTRAL },
  { value: "ALIBABA", label: "Alibaba (Qwen)", logo: providerLogos.ALIBABA },
  { value: "ZHIPU", label: "Zhipu (GLM)", logo: providerLogos.ZHIPU },
  { value: "XAI", label: "xAI (Grok)", logo: providerLogos.XAI },
  { value: "MOONSHOT", label: "Moonshot (Kimi)", logo: providerLogos.MOONSHOT },
  { value: "META", label: "Meta (Llama)", logo: providerLogos.META },
  { value: "MINIMAX", label: "MiniMax", logo: providerLogos.MINIMAX },
];

export default function AdminModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editPriceIn, setEditPriceIn] = useState("");
  const [editPriceOut, setEditPriceOut] = useState("");
  const [newModel, setNewModel] = useState({ name: "", displayName: "", provider: "OPENAI", pricePer1kIn: "0", pricePer1kOut: "0", description: "", maxTokens: "128000", contextWindow: "128000" });

  useEffect(() => {
    fetch("/api/admin/models")
      .then((r) => r.json())
      .then((d) => setModels(d.models || []))
      .catch(() => toast.error("Lỗi tải models"))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(m: Model) {
    const res = await fetch("/api/admin/models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: m.id, isActive: !m.isActive }),
    });
    if (res.ok) {
      setModels((prev) => prev.map((x) => (x.id === m.id ? { ...x, isActive: !x.isActive } : x)));
      toast.success(`${m.displayName} ${m.isActive ? "tắt" : "bật"}`);
    }
  }

  async function deleteModel(m: Model) {
    if (!confirm(`Xác nhận xóa model "${m.displayName}"?`)) return;
    const res = await fetch("/api/admin/models", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: m.id }),
    });
    if (res.ok) {
      setModels((prev) => prev.filter((x) => x.id !== m.id));
      toast.success("Đã xóa model!");
    }
  }

  async function savePrice() {
    if (!editId) return;
    const res = await fetch("/api/admin/models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: editId, pricePer1kIn: parseFloat(editPriceIn), pricePer1kOut: parseFloat(editPriceOut) }),
    });
    if (res.ok) {
      setModels((prev) => prev.map((x) => (x.id === editId ? { ...x, pricePer1kIn: editPriceIn, pricePer1kOut: editPriceOut } : x)));
      toast.success("Đã cập nhật giá");
    }
    setEditId(null);
  }

  async function addModel() {
    const res = await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newModel,
        maxTokens: parseInt(newModel.maxTokens) || 128000,
        contextWindow: parseInt(newModel.contextWindow) || 128000,
      }),
    });
    if (res.ok) {
      toast.success("Đã thêm model");
      setShowAdd(false);
      setNewModel({ name: "", displayName: "", provider: "OPENAI", pricePer1kIn: "0", pricePer1kOut: "0", description: "", maxTokens: "128000", contextWindow: "128000" });
      const d = await res.json();
      setModels((prev) => [d, ...prev]);
    } else {
      const d = await res.json();
      toast.error(d.error || "Lỗi");
    }
  }

  const filtered = models.filter((m) => !search || m.displayName.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Models</h1>
          <p className="text-slate-500 mt-1 text-sm">{models.length} model</p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Tìm..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full lg:w-48 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm">
            <Plus className="w-4 h-4 mr-1" />Thêm
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-lg">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-indigo-500" /> Thêm Model Mới</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-slate-700 text-sm">Name (ID)</Label><Input value={newModel.name} onChange={(e) => setNewModel({ ...newModel, name: e.target.value })} placeholder="gpt-4-turbo" className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Display Name</Label><Input value={newModel.displayName} onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })} placeholder="GPT-4 Turbo" className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Provider</Label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {providerOptions.map((p) => (
                  <button key={p.value} type="button" onClick={() => setNewModel({ ...newModel, provider: p.value })}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${newModel.provider === p.value ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
                    <img src={p.logo} alt={p.label} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div><Label className="text-slate-700 text-sm">Description</Label><Input value={newModel.description} onChange={(e) => setNewModel({ ...newModel, description: e.target.value })} placeholder="Mô tả..." className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Giá Input (VND/1K tokens)</Label><Input type="number" step="1" value={newModel.pricePer1kIn} onChange={(e) => setNewModel({ ...newModel, pricePer1kIn: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Giá Output (VND/1K tokens)</Label><Input type="number" step="1" value={newModel.pricePer1kOut} onChange={(e) => setNewModel({ ...newModel, pricePer1kOut: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Max Tokens</Label><Input type="number" value={newModel.maxTokens} onChange={(e) => setNewModel({ ...newModel, maxTokens: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Context Window</Label><Input type="number" value={newModel.contextWindow} onChange={(e) => setNewModel({ ...newModel, contextWindow: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={addModel} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">Thêm Model</Button>
          </div>
        </div>
      )}

      {editId && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-lg">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Chỉnh Sửa Giá</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-slate-700 text-sm">Giá Input (VND/1K tokens)</Label><Input type="number" step="1" value={editPriceIn} onChange={(e) => setEditPriceIn(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Giá Output (VND/1K tokens)</Label><Input type="number" step="1" value={editPriceOut} onChange={(e) => setEditPriceOut(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditId(null)} className="rounded-xl">Hủy</Button>
            <Button onClick={savePrice} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">Lưu Giá</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Không tìm thấy model</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <div key={m.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${providerBg[m.provider] || "bg-white"} border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden`}>
                    {providerLogos[m.provider] ? (
                      <img src={providerLogos[m.provider]} alt={m.provider} className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <Cpu className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{m.displayName}</span>
                      <Badge className={`${providerColors[m.provider] || "bg-slate-50 text-slate-700 border-slate-200"} text-[10px]`}>{m.provider}</Badge>
                      <Badge className={`${m.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"} text-[10px]`}>{m.isActive ? "Active" : "Disabled"}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{m.name}</code>
                      <span className="text-indigo-600 font-semibold">In: {(parseFloat(String(m.pricePer1kIn)) * 1000).toLocaleString("vi-VN")}đ/1M</span>
                      <span className="text-emerald-600 font-semibold">Out: {(parseFloat(String(m.pricePer1kOut)) * 1000).toLocaleString("vi-VN")}đ/1M</span>
                      <span>{m.maxTokens.toLocaleString()} tokens</span>
                      {m.description && <span className="text-slate-400">{m.description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditId(m.id); setEditPriceIn(String(m.pricePer1kIn)); setEditPriceOut(String(m.pricePer1kOut)); }} className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-indigo-50"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => toggleActive(m)} className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${m.isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>{m.isActive ? "Bật" : "Tắt"}</button>
                    <button onClick={() => deleteModel(m)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50" title="Xóa"><Trash2 className="w-4 h-4" /></button>
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
