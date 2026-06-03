"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText, Code, Globe, Key, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

interface CodeBlockProps {
  title: string;
  language: string;
  code: string;
}

function CodeBlock({ title, language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Đã copy!");
    setTimeout(() => setCopied(false), 2000);
  }
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

export default function ApiDocsPage() {
  const [tab, setTab] = useState("quickstart");

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" /> Tài Liệu API
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Tích hợp API AI của MoraHub vào ứng dụng của bạn</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "quickstart", label: "Bắt đầu", icon: Zap },
          { id: "openai", label: "OpenAI SDK", icon: Code },
          { id: "anthropic", label: "Anthropic SDK", icon: Code },
          { id: "clients", label: "Clients", icon: Globe },
          { id: "reference", label: "Reference", icon: FileText },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-200"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Quickstart */}
      {tab === "quickstart" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Key className="w-5 h-5 text-indigo-500" /> Bước 1: Lấy API Key</h3>
            <p className="text-sm text-slate-600 mb-3">Đăng nhập → Dashboard → API Keys → Tạo Key mới</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              ⚠️ <strong>Lưu ý:</strong> Giữ API key bí mật. Không chia sẻ công khai. Key của bạn chỉ dùng được trên hệ thống MoraHub.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500" /> Bước 2: Base URL</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">OpenAI-compatible</div>
                <code className="text-sm font-bold text-slate-900">https://morahub.online/v1</code>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Anthropic-compatible</div>
                <code className="text-sm font-bold text-slate-900">https://morahub.online</code>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Code className="w-5 h-5 text-purple-500" /> Bước 3: Gọi API</h3>
            <CodeBlock title="cURL" language="bash" code={`curl https://morahub.online/v1/chat/completions \\
  -H "Authorization: Bearer mh-your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Xin chào!"}]
  }'`} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-amber-500" /> Xác thực</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <code className="text-sm font-bold text-indigo-600">API Key</code>
                <span className="text-sm text-slate-600">Đính kèm trong header <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">Authorization: Bearer mh-xxx</code></span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <code className="text-sm font-bold text-indigo-600">IP Whitelist</code>
                <span className="text-sm text-slate-600">Tùy chọn — giới hạn IP được phép gọi API</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <code className="text-sm font-bold text-indigo-600">Domain Whitelist</code>
                <span className="text-sm text-slate-600">Tùy chọn — giới hạn domain được phép</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <code className="text-sm font-bold text-indigo-600">Rate Limit</code>
                <span className="text-sm text-slate-600">Giới hạn requests/phút theo key</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OpenAI SDK */}
      {tab === "openai" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">OpenAI-compatible Request</h3>
            <CodeBlock title="Python" language="python" code={`from openai import OpenAI

client = OpenAI(
    api_key="mh-your-api-key-here",
    base_url="https://morahub.online/v1",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello from MoraHub"}
    ],
)

print(response.choices[0].message.content)`} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Streaming</h3>
            <CodeBlock title="Python" language="python" code={`from openai import OpenAI

client = OpenAI(
    api_key="mh-your-api-key-here",
    base_url="https://morahub.online/v1",
)

stream = client.chat.completions.create(
    model="gpt-4o",
    stream=True,
    messages=[
        {"role": "user", "content": "Write a short poem."}
    ],
)

for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    if delta:
        print(delta, end="", flush=True)`} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Node.js</h3>
            <CodeBlock title="JavaScript" language="javascript" code={`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'mh-your-api-key-here',
  baseURL: 'https://morahub.online/v1',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);`} />
          </div>
        </div>
      )}

      {/* Anthropic SDK */}
      {tab === "anthropic" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Anthropic Request</h3>
            <CodeBlock title="Python" language="python" code={`from anthropic import Anthropic

client = Anthropic(
    api_key="mh-your-api-key-here",
    base_url="https://morahub.online",
)

message = client.messages.create(
    model="claude-opus-4.6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Write a fizzbuzz in Python."}
    ],
)

print(message.content)`} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Streaming</h3>
            <CodeBlock title="Python" language="python" code={`from anthropic import Anthropic

client = Anthropic(
    api_key="mh-your-api-key-here",
    base_url="https://morahub.online",
)

with client.messages.stream(
    model="claude-opus-4.6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Tell me a short story."}
    ],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`} />
          </div>
        </div>
      )}

      {/* Clients */}
      {tab === "clients" && (
        <div className="space-y-4">
          {[
            {
              name: "Cursor",
              desc: "AI Code Editor",
              provider: "OpenAI-compatible",
              baseUrl: "https://morahub.online/v1",
              model: "gpt-4o",
              steps: ["Mở Cursor Settings → AI / Models", "Bật custom OpenAI key hoặc custom provider", "Dán API key (mh-xxx) và Base URL", "Chọn model đang active trong bảng giá", "Test bằng prompt ngắn để xác nhận"],
            },
            {
              name: "Claude Code",
              desc: "Anthropic CLI",
              provider: "Anthropic-compatible",
              baseUrl: "https://morahub.online",
              model: "claude-opus-4.6",
              steps: ["Set env ANTHROPIC_API_KEY=mh-your-api-key", "Set env ANTHROPIC_BASE_URL=https://morahub.online", "Chạy claude-code như bình thường"],
            },
            {
              name: "VS Code Extensions",
              desc: "Continue, Cody, etc.",
              provider: "OpenAI-compatible",
              baseUrl: "https://morahub.online/v1",
              model: "gpt-4o",
              steps: ["Mở extension settings", "Chọn OpenAI provider", "Nhập API key (mh-xxx) + Base URL", "Chọn model đang active"],
            },
            {
              name: "OpenClaw",
              desc: "AI Agent Platform",
              provider: "OpenAI-compatible",
              baseUrl: "https://morahub.online/v1",
              model: "gpt-4o",
              steps: ["Thêm provider trong config", "Nhập API key (mh-xxx)", "Set base URL: https://morahub.online/v1", "Chọn model"],
            },
            {
              name: "cURL",
              desc: "Command Line",
              provider: "OpenAI-compatible",
              baseUrl: "https://morahub.online/v1",
              model: "gpt-4o",
              steps: ["Gửi POST đến /v1/chat/completions", "Header: Authorization: Bearer mh-xxx", "Body: { model, messages }"],
            },
          ].map((c) => (
            <div key={c.name} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.desc}</p>
                </div>
                <span className="ml-auto bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2 py-0.5 rounded-lg font-semibold">{c.provider}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mb-3">
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-[10px] text-slate-500 block">Base URL</span><code className="text-xs font-bold text-slate-900">{c.baseUrl}</code></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-[10px] text-slate-500 block">Model</span><code className="text-xs font-bold text-slate-900">{c.model}</code></div>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                {c.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Reference */}
      {tab === "reference" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Endpoint</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Chat Completions (OpenAI)</div>
                <code className="text-sm font-bold text-slate-900">POST https://morahub.online/v1/chat/completions</code>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Messages (Anthropic)</div>
                <code className="text-sm font-bold text-slate-900">POST https://morahub.online/v1/messages</code>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Request Format</h3>
            <CodeBlock title="POST /v1/chat/completions" language="json" code={`{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 4096,
  "temperature": 0.7,
  "stream": false
}`} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Response Format</h3>
            <CodeBlock title="200 OK" language="json" code={`{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Hello!"},
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  }
}`} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Error Codes</h3>
            <div className="space-y-2">
              {[
                { code: "400", desc: "Model không hợp lệ hoặc chưa active" },
                { code: "401", desc: "API key không hợp lệ hoặc đã hết hạn" },
                { code: "403", desc: "IP hoặc Domain không được phép truy cập" },
                { code: "429", desc: "Vượt quá rate limit — thử lại sau" },
                { code: "500", desc: "Lỗi server nội bộ — liên hệ hỗ trợ" },
              ].map((e) => (
                <div key={e.code} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <code className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{e.code}</code>
                  <span className="text-sm text-slate-600">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Models Available</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { name: "gpt-4o", provider: "OpenAI" },
                { name: "gpt-4o-mini", provider: "OpenAI" },
                { name: "claude-3.5-sonnet", provider: "Anthropic" },
                { name: "claude-3-haiku", provider: "Anthropic" },
                { name: "gemini-pro", provider: "Google" },
                { name: "deepseek-chat", provider: "DeepSeek" },
                { name: "mistral-large", provider: "Mistral" },
                { name: "qwen-max", provider: "Alibaba" },
                { name: "glm-4", provider: "Zhipu" },
                { name: "grok-2", provider: "xAI" },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <code className="text-xs font-bold text-slate-900">{m.name}</code>
                  <span className="text-[10px] text-slate-500">{m.provider}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
