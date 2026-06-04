"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
}

const sections = [
  {
    title: "🔑 Authentication",
    endpoints: [
      { method: "POST", path: "/api/auth/login", description: "Đăng nhập", params: [
        { name: "email", type: "string", required: true, description: "Email" },
        { name: "password", type: "string", required: true, description: "Mật khẩu" },
      ], response: '{ "success": true }' },
      { method: "POST", path: "/api/auth/register", description: "Đăng ký", params: [
        { name: "name", type: "string", required: true, description: "Tên" },
        { name: "email", type: "string", required: true, description: "Email" },
        { name: "password", type: "string", required: true, description: "Mật khẩu" },
      ], response: '{ "success": true, "user": {...} }' },
    ] as Endpoint[],
  },
  {
    title: "💰 Dashboard",
    endpoints: [
      { method: "GET", path: "/api/dashboard", description: "Lấy thông tin dashboard", response: '{ "user": {...}, "transactions": [...] }' },
      { method: "GET", path: "/api/notifications?action=count", description: "Đếm thông báo chưa đọc", response: '{ "count": 5 }' },
    ] as Endpoint[],
  },
  {
    title: "💳 Nạp tiền",
    endpoints: [
      { method: "POST", path: "/api/deposit", description: "Tạo giao dịch nạp tiền", params: [
        { name: "amount", type: "number", required: true, description: "Số tiền (VND)" },
      ], response: '{ "transaction": {...}, "qrCode": "data:image/..." }' },
      { method: "POST", path: "/api/top-up/cancel", description: "Hủy giao dịch", params: [
        { name: "reference", type: "string", required: true, description: "Mã giao dịch" },
      ], response: '{ "success": true }' },
    ] as Endpoint[],
  },
  {
    title: "🎫 Support",
    endpoints: [
      { method: "POST", path: "/api/support/check-deposit", description: "Kiểm tra giao dịch", params: [
        { name: "reference", type: "string", required: true, description: "Mã giao dịch (MORA...)" },
      ], response: '{ "transaction": {...}, "status": "found" }' },
      { method: "POST", path: "/api/support/auto-credit", description: "Tự động cộng tiền", params: [
        { name: "reference", type: "string", required: true, description: "Mã giao dịch" },
        { name: "content", type: "string", required: false, description: "Nội dung đúng" },
        { name: "amount", type: "number", required: false, description: "Số tiền đúng" },
      ], response: '{ "success": true, "newBalance": 150000 }' },
      { method: "GET", path: "/api/support/tickets", description: "Danh sách ticket", response: '{ "tickets": [...] }' },
      { method: "POST", path: "/api/support/tickets/[id]", description: "Gửi tin nhắn ticket", params: [
        { name: "message", type: "string", required: true, description: "Nội dung tin nhắn" },
      ], response: '{ "success": true }' },
    ] as Endpoint[],
  },
  {
    title: "🔑 API Keys",
    endpoints: [
      { method: "GET", path: "/api/keys", description: "Danh sách API keys", response: '{ "keys": [...] }' },
      { method: "POST", path: "/api/keys", description: "Tạo API key mới", params: [
        { name: "name", type: "string", required: true, description: "Tên key" },
        { name: "expiresInDays", type: "number", required: false, description: "Số ngày hết hạn" },
      ], response: '{ "key": "mora_xxx..." }' },
      { method: "PUT", path: "/api/keys", description: "Rotate API key", params: [
        { name: "keyId", type: "string", required: true, description: "ID key" },
      ], response: '{ "key": "mora_xxx..." }' },
      { method: "DELETE", path: "/api/keys", description: "Xóa API key", params: [
        { name: "keyId", type: "string", required: true, description: "ID key" },
      ], response: '{ "success": true }' },
    ] as Endpoint[],
  },
  {
    title: "🔒 Security",
    endpoints: [
      { method: "GET", path: "/api/profile/2fa", description: "Kiểm tra trạng thái 2FA", response: '{ "enabled": false }' },
      { method: "POST", path: "/api/profile/2fa", description: "Bật 2FA (tạo QR)", response: '{ "qrCode": "data:image/...", "secret": "xxx" }' },
      { method: "POST", path: "/api/profile/2fa/verify", description: "Xác nhận 2FA", params: [
        { name: "code", type: "string", required: true, description: "Mã 6 số" },
        { name: "secret", type: "string", required: true, description: "Secret key" },
      ], response: '{ "success": true }' },
      { method: "DELETE", path: "/api/profile/2fa", description: "Tắt 2FA", response: '{ "success": true }' },
    ] as Endpoint[],
  },
  {
    title: "📊 Admin",
    endpoints: [
      { method: "GET", path: "/api/admin/analytics?period=7d", description: "Analytics dashboard", response: '{ "revenue": {...}, "users": {...}, "topModels": [...] }' },
      { method: "GET", path: "/api/admin/bi?period=30d", description: "Business Intelligence", response: '{ "revenue": {...}, "predictions": {...} }' },
      { method: "GET", path: "/api/admin/users", description: "Danh sách users", response: '{ "users": [...] }' },
      { method: "POST", path: "/api/admin/users", description: "Quản lý user", params: [
        { name: "userId", type: "string", required: true, description: "ID user" },
        { name: "action", type: "string", required: true, description: "role|status" },
        { name: "value", type: "string", required: true, description: "Giá trị mới" },
      ], response: '{ "success": true }' },
    ] as Endpoint[],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function copyEndpoint(path: string) {
    navigator.clipboard.writeText(`https://morahub.online${path}`);
    setCopied(path);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleSection(title: string) {
    setExpanded(prev => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">📚 API Documentation</h1>
        <a href="/api/docs" target="_blank" className="text-sm text-indigo-500 hover:underline flex items-center gap-1">
          OpenAPI JSON <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-4">
          <p className="text-sm text-indigo-800">
            <strong>Base URL:</strong> <code>https://morahub.online</code>
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            Cần Authorization header: <code>Bearer &lt;session-token&gt;</code> hoặc API key: <code>x-api-key: mora_xxx</code>
          </p>
        </CardContent>
      </Card>

      {sections.map(section => (
        <Card key={section.title}>
          <CardHeader className="p-3 cursor-pointer" onClick={() => toggleSection(section.title)}>
            <CardTitle className="text-sm flex items-center gap-2">
              {expanded[section.title] === false ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {section.title}
              <span className="text-xs text-slate-400 font-normal">({section.endpoints.length})</span>
            </CardTitle>
          </CardHeader>
          {expanded[section.title] !== false && (
            <CardContent className="p-0">
              {section.endpoints.map((ep, i) => (
                <div key={i} className="border-t p-3 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${methodColors[ep.method]}`}>{ep.method}</span>
                    <code className="text-sm font-mono text-slate-700">{ep.path}</code>
                    <button onClick={() => copyEndpoint(ep.path)} className="text-slate-400 hover:text-slate-600">
                      {copied === ep.path ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{ep.description}</p>
                  {ep.params && (
                    <div className="mb-2">
                      <p className="text-[10px] text-slate-400 mb-1">Parameters:</p>
                      <div className="space-y-1">
                        {ep.params.map(p => (
                          <div key={p.name} className="flex items-center gap-2 text-xs">
                            <code className="font-mono text-slate-600">{p.name}</code>
                            <span className="text-slate-300">{p.type}</span>
                            {p.required && <span className="text-red-500 text-[10px]">required</span>}
                            <span className="text-slate-400">{p.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-slate-400 mb-1">Response:</p>
                    <pre className="text-xs bg-slate-100 p-2 rounded font-mono text-slate-600 overflow-x-auto">{ep.response}</pre>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
