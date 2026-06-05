"use client";

import Link from "next/link";
import { useState } from "react";

const codeExamples = {
  curl: `curl -X POST https://morahub.online/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-5.4",
    "messages": [
      {"role": "user", "content": "Xin chào!"}
    ]
  }'`,
  python: `import requests

response = requests.post(
    "https://morahub.online/api/v1/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    },
    json={
        "model": "gpt-5.4",
        "messages": [
            {"role": "user", "content": "Xin chào!"}
        ]
    }
)

print(response.json())`,
  javascript: `const response = await fetch(
  "https://morahub.online/api/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_API_KEY"
    },
    body: JSON.stringify({
      model: "gpt-5.4",
      messages: [
        { role: "user", content: "Xin chào!" }
      ]
    })
  }
);

const data = await response.json();
console.log(data);`,
  php: `$ch = curl_init("https://morahub.online/api/v1/chat/completions");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer YOUR_API_KEY"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "model" => "gpt-5.4",
        "messages" => [
            ["role" => "user", "content" => "Xin chào!"]
        ]
    ]),
    CURLOPT_RETURNTRANSFER => true
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
};

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/chat/completions",
    desc: "Tạo completion (chat)",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/models",
    desc: "Danh sách models khả dụng",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/usage",
    desc: "Lịch sử sử dụng",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/keys",
    desc: "Quản lý API keys",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/v1/keys",
    desc: "Tạo API key mới",
    auth: true,
  },
  {
    method: "DELETE",
    path: "/api/v1/keys/:id",
    desc: "Xóa API key",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/v1/balance",
    desc: "Kiểm tra số dư credits",
    auth: true,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  PATCH: "bg-amber-100 text-amber-700",
};

const models = [
  { name: "gpt-5.4", provider: "OpenAI", input: "1.5", output: "10", context: "1M" },
  { name: "gpt-5.4-mini", provider: "OpenAI", input: "0.5", output: "3", context: "400K" },
  { name: "gpt-5.5", provider: "OpenAI", input: "3", output: "14", context: "1M" },
  { name: "claude-3.5-sonnet", provider: "Anthropic", input: "3", output: "15", context: "200K" },
  { name: "claude-3-haiku", provider: "Anthropic", input: "0.25", output: "1.25", context: "200K" },
  { name: "gemini-pro", provider: "Google", input: "0.25", output: "0.5", context: "1M" },
  { name: "deepseek-v4-pro", provider: "DeepSeek", input: "1.5", output: "7", context: "1M" },
  { name: "deepseek-3.2", provider: "DeepSeek", input: "0.18", output: "0.25", context: "128K" },
  { name: "grok-4.3", provider: "xAI", input: "1.2", output: "2.2", context: "128K" },
  { name: "qwen-max", provider: "Alibaba", input: "0.4", output: "1.2", context: "32K" },
];

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<keyof typeof codeExamples>("curl");
  const [activeSection, setActiveSection] = useState("quickstart");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-morahub.png" alt="MoraHub" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-lg font-bold text-slate-900">MoraHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
            >
              Bắt đầu
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Bắt Đầu</h4>
              {[
                { id: "quickstart", label: "Quick Start" },
                { id: "auth", label: "Xác Thực" },
                { id: "models", label: "Models & Giá" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSection === item.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6 px-3">API</h4>
              {[
                { id: "endpoints", label: "Endpoints" },
                { id: "streaming", label: "Streaming" },
                { id: "errors", label: "Lỗi & Mã Lỗi" },
                { id: "sdks", label: "SDKs" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSection === item.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Quick Start */}
            {activeSection === "quickstart" && (
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Quick Start</h1>
                <p className="text-slate-600 mb-8">Bắt đầu sử dụng MoraHub API trong 3 bước đơn giản.</p>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">1</div>
                      <h3 className="font-bold text-slate-900">Tạo tài khoản</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Đăng ký miễn phí tại morahub.online/register. Bạn sẽ nhận ngay 10,000 credits.</p>
                    <Link href="/register" className="text-sm font-semibold text-indigo-600 hover:underline">Đăng ký ngay →</Link>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">2</div>
                      <h3 className="font-bold text-slate-900">Tạo API Key</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Vào Dashboard → API Keys → Tạo key mới. Copy key và giữ an toàn.</p>
                    <Link href="/dashboard/keys" className="text-sm font-semibold text-indigo-600 hover:underline">Đi đến Dashboard →</Link>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">3</div>
                      <h3 className="font-bold text-slate-900">Gọi API</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">Sử dụng API key để gọi bất kỳ model nào. Dưới đây là ví dụ nhanh:</p>

                    {/* Code tabs */}
                    <div className="bg-slate-900 rounded-xl overflow-hidden">
                      <div className="flex border-b border-slate-700">
                        {Object.keys(codeExamples).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setActiveTab(lang as keyof typeof codeExamples)}
                            className={`px-4 py-2 text-xs font-medium transition-all ${
                              activeTab === lang
                                ? "bg-slate-700 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {lang.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
                        <code>{codeExamples[activeTab]}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auth */}
            {activeSection === "auth" && (
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Xác Thực</h1>
                <p className="text-slate-600 mb-8">Mọi request đều cần API key trong header Authorization.</p>

                <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
                  <h3 className="font-bold text-slate-900 mb-4">Header Format</h3>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <code className="text-sm text-slate-300">Authorization: Bearer YOUR_API_KEY</code>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
                  <h3 className="font-bold text-slate-900 mb-4">API Key Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">FULL</span>
                      <span className="text-sm text-slate-600">Đọc & ghi — đầy đủ quyền truy cập</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">READ_ONLY</span>
                      <span className="text-sm text-slate-600">Chỉ đọc — không thể tạo/completion</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">WRITE_ONLY</span>
                      <span className="text-sm text-slate-600">Chỉ ghi — tạo completion được, đọc lịch sử không</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h3 className="font-bold text-amber-800 mb-2">⚠️ Bảo Mật</h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Không commit API key lên GitHub</li>
                    <li>• Sử dụng environment variables</li>
                    <li>• Giới hạn IP/domain nếu có thể</li>
                    <li>• Rotate key định kỳ</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Models */}
            {activeSection === "models" && (
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Models & Giá</h1>
                <p className="text-slate-600 mb-8">Danh sách model hiện có và giá per 1K tokens (VND).</p>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-3 font-semibold text-slate-900">Model</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-900">Provider</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-900">Input / 1K</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-900">Output / 1K</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-900">Context</th>
                        </tr>
                      </thead>
                      <tbody>
                        {models.map((m, i) => (
                          <tr key={m.name} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                            <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                            <td className="px-4 py-3 text-slate-500">{m.provider}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{m.input}đ</td>
                            <td className="px-4 py-3 text-right text-slate-600">{m.output}đ</td>
                            <td className="px-4 py-3 text-right text-slate-600">{m.context}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Endpoints */}
            {activeSection === "endpoints" && (
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Endpoints</h1>
                <p className="text-slate-600 mb-8">Base URL: <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">https://morahub.online/api/v1</code></p>

                <div className="space-y-3">
                  {endpoints.map((ep, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-slate-900 flex-1">{ep.path}</code>
                      <span className="text-sm text-slate-500 hidden sm:block">{ep.desc}</span>
                      {ep.auth && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">🔑 Auth</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Streaming */}
            {activeSection === "streaming" && (
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Streaming</h1>
                <p className="text-slate-600 mb-8">Hỗ trợ streaming response real-time (Server-Sent Events).</p>

                <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
                  <h3 className="font-bold text-slate-900 mb-4">Cách bật Streaming</h3>
                  <p className="text-sm text-slate-600 mb-4">Thêm <code className="bg-slate-100 px-1.5 py-0.5 rounded">"stream": true</code> vào request body:</p>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <pre className="text-sm text-slate-300 overflow-x-auto">
{`{
  "model": "gpt-5.4",
  "messages": [
    {"role": "user", "content": "Viết một bài thơ"}
  ],
  "stream": true
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-900 mb-4">JavaScript Example</h3>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <pre className="text-sm text-slate-300 overflow-x-auto">
{`const response = await fetch("/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  },
  body: JSON.stringify({
    model: "gpt-5.4",
    messages: [{ role: "user", content: "Xin chào!" }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Process SSE chunk
  console.log(chunk);
}`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {activeSection === "errors" && (
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Lỗi & Mã Lỗi</h1>
                <p className="text-slate-600 mb-8">Danh sách mã lỗi thường gặp khi sử dụng API.</p>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-3 font-semibold text-slate-900">Code</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-900">Mô Tả</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-900">Giải Pháp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { code: "400", desc: "Bad Request", fix: "Kiểm tra request body, model name" },
                          { code: "401", desc: "Unauthorized", fix: "API key không hợp lệ hoặc hết hạn" },
                          { code: "403", desc: "Forbidden", fix: "API key không có quyền truy cập resource" },
                          { code: "404", desc: "Not Found", fix: "Endpoint hoặc model không tồn tại" },
                          { code: "429", desc: "Rate Limited", fix: "Giảm tần suất request, upgrade plan" },
                          { code: "500", desc: "Server Error", fix: "Lỗi hệ thống, thử lại sau" },
                          { code: "503", desc: "Service Unavailable", fix: "Dịch vụ tạm ngưng, thử lại sau" },
                        ].map((err, i) => (
                          <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                            <td className="px-4 py-3">
                              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">{err.code}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">{err.desc}</td>
                            <td className="px-4 py-3 text-slate-600">{err.fix}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SDKs */}
            {activeSection === "sdks" && (
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">SDKs</h1>
                <p className="text-slate-600 mb-8">MoraHub tương thích với SDK chính thức của tất cả provider.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: "Python", pkg: "pip install openai", code: `from openai import OpenAI\n\nclient = OpenAI(\n  api_key="YOUR_API_KEY",\n  base_url="https://morahub.online/api/v1"\n)\n\nresponse = client.chat.completions.create(\n  model="gpt-5.4",\n  messages=[{"role": "user", "content": "Xin chào!"}]\n)\nprint(response.choices[0].message.content)` },
                    { name: "JavaScript", pkg: "npm install openai", code: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: "YOUR_API_KEY",\n  baseURL: "https://morahub.online/api/v1"\n});\n\nconst response = await client.chat.completions.create({\n  model: "gpt-5.4",\n  messages: [{ role: "user", content: "Xin chào!" }]\n});\nconsole.log(response.choices[0].message.content);` },
                    { name: "Go", pkg: "go get github.com/sashabaranov/go-openai", code: `import "github.com/sashabaranov/go-openai"\n\nclient := openai.NewClientWithConfig(\n  openai.DefaultConfig("YOUR_API_KEY"),\n)\n// Change base URL:\nconfig := openai.DefaultConfig("YOUR_API_KEY")\nconfig.BaseURL = "https://morahub.online/api/v1"\nclient = openai.NewClientWithConfig(config)` },
                    { name: "PHP", pkg: "composer require orhanerday/openai-php", code: `$client = OpenAI::factory()\n  ->withApiKey("YOUR_API_KEY")\n  ->withBaseUrl("https://morahub.online/api/v1/")\n  ->make();\n\n$response = $client->chat()->create([\n  'model' => 'gpt-5.4',\n  'messages' => [\n    ['role' => 'user', 'content' => 'Xin chào!']\n  ]\n]);` },
                  ].map((sdk) => (
                    <div key={sdk.name} className="bg-white rounded-2xl border border-slate-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900">{sdk.name}</h3>
                        <code className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">{sdk.pkg}</code>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-4">
                        <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre">{sdk.code}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white">M</div>
                <span className="text-lg font-bold text-white">MoraHub</span>
              </div>
              <p className="text-sm max-w-xs">Nền tảng API AI hàng đầu Việt Nam.</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-3">Sản phẩm</h4>
                <div className="space-y-2 text-sm">
                  <Link href="/pricing" className="block hover:text-white">Bảng Giá</Link>
                  <Link href="/docs" className="block hover:text-white">API Docs</Link>
                  <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Hỗ trợ</h4>
                <div className="space-y-2 text-sm">
                  <Link href="/dashboard/tickets" className="block hover:text-white">Liên hệ</Link>
                  <Link href="/docs" className="block hover:text-white">Tài liệu</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">© 2026 MoraHub. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
