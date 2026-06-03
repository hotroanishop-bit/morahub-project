"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Zap, Shield, Globe, CreditCard, BarChart3, Headphones, ChevronRight } from "lucide-react";

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

const features = [
  { icon: Zap, title: "Nhanh & Ổn Định", desc: "API response < 100ms. Uptime 99.9%.", color: "from-amber-500 to-orange-500" },
  { icon: Shield, title: "Bảo Mật Cao", desc: "API key encryption, rate limiting, audit logs.", color: "from-emerald-500 to-green-500" },
  { icon: Globe, title: "Multi-Model", desc: "16+ model AI từ 8 provider khác nhau.", color: "from-blue-500 to-cyan-500" },
  { icon: CreditCard, title: "Thanh Toán Dễ Dàng", desc: "VietQR, chuyển khoản, nạp tiền tự động.", color: "from-pink-500 to-rose-500" },
  { icon: BarChart3, title: "Theo Dõi Chi Tiết", desc: "Dashboard usage, chi phí theo thời gian thực.", color: "from-indigo-500 to-purple-500" },
  { icon: Headphones, title: "Hỗ Trợ 24/7", desc: "Chat trực tiếp với admin, phản hồi nhanh.", color: "from-violet-500 to-purple-500" },
];

export default function HomePage() {
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/models")
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : d.models || [];
        setModels(arr.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-morahub.png" alt="MoraHub" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-lg font-bold text-slate-900">MoraHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Đăng nhập</Link>
            <Link href="/register" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all">Bắt đầu</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" /> Nền tảng API AI #1 Việt Nam
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
              Truy Cập <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Mọi Model AI</span> Qua Một API
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
              OpenAI, Claude, Gemini, DeepSeek... Thanh toán theo nhu cầu. Không cần nhiều tài khoản, không cần信用卡 nước ngoài.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl text-base font-semibold hover:shadow-xl transition-all inline-flex items-center justify-center gap-2">
                Dùng Thử Miễn Phí <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/dashboard/api-docs" className="bg-white text-slate-700 px-8 py-3 rounded-xl text-base font-semibold border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                Xem Tài Liệu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">Model Phổ Biến</h2>
            <p className="text-slate-600 mt-2">Giá tốt nhất thị trường, thanh toán VND</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m) => (
              <div key={m.name} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden">
                    {providerLogos[m.provider] ? (
                      <img src={providerLogos[m.provider]} alt={m.provider} className="w-7 h-7 object-contain" />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{m.displayName || m.name}</div>
                    <div className="text-xs text-slate-500">{m.provider}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-indigo-50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-indigo-600">Input/1M</div>
                    <div className="text-sm font-bold text-indigo-700">{Math.round(Number(m.pricePer1kIn) * 1000).toLocaleString()}đ</div>
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-emerald-600">Output/1M</div>
                    <div className="text-sm font-bold text-emerald-700">{Math.round(Number(m.pricePer1kOut) * 1000).toLocaleString()}đ</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/dashboard/models" className="text-indigo-600 font-semibold text-sm hover:underline inline-flex items-center gap-1">
              Xem tất cả models <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">Tại Sao Chọn MoraHub?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-white/80 mb-8">Đăng ký miễn phí, nhận 10,000 credits ngay lập tức</p>
          <Link href="/register" className="bg-white text-indigo-600 px-8 py-3 rounded-xl text-base font-semibold hover:shadow-xl transition-all inline-flex items-center gap-2">
            Đăng Ký Miễn Phí <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white">M</div>
                <span className="text-lg font-bold text-white">MoraHub</span>
              </div>
              <p className="text-sm max-w-xs">Nền tảng API AI hàng đầu Việt Nam. Truy cập mọi model qua một API duy nhất.</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-3">Sản phẩm</h4>
                <div className="space-y-2 text-sm">
                  <Link href="/dashboard/models" className="block hover:text-white">Models & Giá</Link>
                  <Link href="/dashboard/api-docs" className="block hover:text-white">API Docs</Link>
                  <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Hỗ trợ</h4>
                <div className="space-y-2 text-sm">
                  <Link href="/dashboard/tickets" className="block hover:text-white">Liên hệ</Link>
                  <Link href="/dashboard/api-docs" className="block hover:text-white">Tài liệu</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
            © 2026 MoraHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
