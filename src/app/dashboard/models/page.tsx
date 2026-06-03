"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Cpu, Search, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => setModels(Array.isArray(d) ? d : d.models || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyModelId(e: React.MouseEvent, name: string) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopiedId(name);
    toast.success(`Đã copy: ${name}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = models.filter((m) => {
    if (!m.isActive) return false;
    if (filter !== "ALL" && m.provider !== filter) return false;
    if (search && !m.displayName.toLowerCase().includes(search.toLowerCase()) && !m.provider.toLowerCase().includes(search.toLowerCase()) && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const providers = [...new Set(models.filter((m) => m.isActive).map((m) => m.provider))];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Model & Báo Giá</h1>
        <p className="text-slate-500 mt-1 text-sm">Danh sách model AI và bảng giá chi tiết</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm model..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilter("ALL")} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === "ALL" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200"}`}>Tất cả</button>
          {providers.map((p) => (
            <button key={p} onClick={() => setFilter(p)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === p ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500 border-slate-200"}`}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Chưa có model nào</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <a key={m.id} href={`/dashboard/models/${encodeURIComponent(m.name)}`} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer group block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden">
                  {providerLogos[m.provider] ? (
                    <img src={providerLogos[m.provider]} alt={m.provider} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Cpu className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <Badge className={`${providerColors[m.provider] || "bg-slate-50 text-slate-700 border-slate-200"} text-[10px]`}>{m.provider}</Badge>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{m.displayName}</h3>
              {m.description && <p className="text-xs text-slate-500 mt-1">{m.description}</p>}

              <div className="flex items-center gap-2 mt-2">
                <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs text-slate-600">{m.name}</code>
                <button onClick={(e) => copyModelId(e, m.name)} className="text-slate-400 hover:text-indigo-500 p-1 rounded hover:bg-indigo-50 transition-all">
                  {copiedId === m.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between p-1.5 bg-indigo-50 rounded-lg">
                  <span className="text-[10px] text-indigo-600">Input / 1M</span>
                  <span className="font-bold text-indigo-700 text-xs">{(parseFloat(String(m.pricePer1kIn)) * 1000).toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-emerald-50 rounded-lg">
                  <span className="text-[10px] text-emerald-600">Output / 1M</span>
                  <span className="font-bold text-emerald-700 text-xs">{(parseFloat(String(m.pricePer1kOut)) * 1000).toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-slate-400">{(m.contextWindow / 1000).toFixed(0)}K context</span>
                <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                  Chi tiết <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
