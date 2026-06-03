"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ArrowLeft, Zap, Globe, Code } from "lucide-react";
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

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(code); setCopied(true); toast.success("Đã copy!"); setTimeout(() => setCopied(false), 2000); }
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        <button onClick={copy} className="text-slate-400 hover:text-indigo-500 p-1">{copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
      </div>
      <pre className="p-4 text-sm text-slate-800 overflow-x-auto bg-white"><code>{code}</code></pre>
    </div>
  );
}

export default function ModelDetailPage() {
  const params = useParams();
  const modelId = params?.id as string;
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        const models = Array.isArray(d) ? d : d.models || [];
        const found = models.find((m: Model) => m.name === modelId);
        setModel(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [modelId]);

  function copyModelId() {
    if (!model) return;
    navigator.clipboard.writeText(model.name);
    setCopied(true);
    toast.success("Đã copy model ID!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="text-center py-20 text-slate-400">Đang tải...</div>;
  if (!model) return <div className="text-center py-20 text-slate-400">Model không tồn tại</div>;

  const inPrice = (parseFloat(String(model.pricePer1kIn)) * 1000).toLocaleString("vi-VN");
  const outPrice = (parseFloat(String(model.pricePer1kOut)) * 1000).toLocaleString("vi-VN");

  const curlExample = `curl 'https://morahub.online/v1/chat/completions' \\
  -H 'Authorization: Bearer ***' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "model": "${model.name}",
    "messages": [
      {"role": "user", "content": "Xin chào, bạn là ai?"}
    ]
  }'`;

  const jsExample = `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'mh-your-api-key',
  baseURL: 'https://morahub.online/v1',
});

const response = await client.chat.completions.create({
  model: '${model.name}',
  messages: [{ role: 'user', content: 'Xin chào!' }],
});

console.log(response.choices[0].message.content);`;

  const pythonExample = `from openai import OpenAI

client = OpenAI(
    api_key=***
    base_url="https://morahub.online/v1",
)

response = client.chat.completions.create(
    model="${model.name}",
    messages=[{"role": "user", "content": "Xin chào!"}],
)

print(response.choices[0].message.content)`;

  return (
    <div className="space-y-4 lg:space-y-6 max-w-4xl">
      <a href="/dashboard/models" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="w-4 h-4" /> Quay lại Models
      </a>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden">
            {providerLogos[model.provider] ? (
              <img src={providerLogos[model.provider]} alt={model.provider} className="w-12 h-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl">🤖</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">{model.displayName}</h1>
              <Badge className={`${providerColors[model.provider] || "bg-slate-50 text-slate-700 border-slate-200"} text-xs`}>{model.provider}</Badge>
            </div>
            {model.description && <p className="text-slate-500 mt-1">{model.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <code className="bg-slate-100 px-3 py-1 rounded-lg font-mono text-sm text-slate-700">{model.name}</code>
              <button onClick={copyModelId} className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <span className="text-xs text-slate-400">Click copy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Context</div>
          <div className="text-lg font-extrabold text-slate-900">{(model.contextWindow / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Input / 1M token</div>
          <div className="text-lg font-extrabold text-indigo-600">{inPrice}đ</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Output / 1M token</div>
          <div className="text-lg font-extrabold text-emerald-600">{outPrice}đ</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Max Tokens</div>
          <div className="text-lg font-extrabold text-slate-900">{(model.maxTokens / 1000).toFixed(0)}K</div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500" /> Endpoints hỗ trợ</h3>
        <div className="space-y-2">
          {["/v1/chat/completions", "/v1/models"].map((ep) => (
            <div key={ep} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold">POST</span>
              <code className="text-sm font-mono text-slate-700">https://morahub.online{ep}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Request Examples */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-purple-500" /> Ví dụ request</h3>
        <div className="space-y-4">
          <CodeBlock title="cURL" code={curlExample} />
          <CodeBlock title="JavaScript" code={jsExample} />
          <CodeBlock title="Python" code={pythonExample} />
        </div>
      </div>

      {/* Quick Setup */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Zap className="w-5 h-5" /> Dùng ngay</h3>
        <p className="text-sm text-white/80 mb-4">Lấy API key từ Dashboard → API Keys và bắt đầu gọi API</p>
        <div className="flex gap-2">
          <a href="/dashboard/keys" className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">Lấy API Key</a>
          <a href="/dashboard/api-docs" className="bg-white/20 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors">Xem Docs</a>
        </div>
      </div>
    </div>
  );
}
