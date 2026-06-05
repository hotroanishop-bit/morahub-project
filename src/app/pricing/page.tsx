import Link from "next/link";

const plans = [
  {
    name: "free",
    displayName: "Miễn Phí",
    description: "Dùng thử, không ràng buộc",
    price: 0,
    credits: 10000,
    rateLimit: 10,
    maxKeys: 3,
    maxTokens: 2048,
    features: ["Tất cả model cơ bản", "Rate limit 10 req/min", "10K credits/tháng"],
    cta: "Đăng Ký Miễn Phí",
    popular: false,
  },
  {
    name: "basic",
    displayName: "Cơ Bản",
    description: "Dành cho developer cá nhân",
    price: 250000,
    credits: 100000,
    rateLimit: 30,
    maxKeys: 5,
    maxTokens: 4096,
    features: ["Tất cả model", "Rate limit 30 req/min", "100K credits/tháng", "Hỗ trợ email"],
    cta: "Nâng Cấp",
    popular: false,
  },
  {
    name: "pro",
    displayName: "Chuyên Nghiệp",
    description: "Dành cho team & startup",
    price: 1000000,
    credits: 500000,
    rateLimit: 100,
    maxKeys: 20,
    maxTokens: 8192,
    features: ["Tất cả model", "Rate limit 100 req/min", "500K credits/tháng", "Hỗ trợ ưu tiên", "Streaming"],
    cta: "Nâng Cấp",
    popular: true,
  },
  {
    name: "enterprise",
    displayName: "Doanh Nghiệp",
    description: "Giải pháp tùy chỉnh",
    price: null,
    credits: null,
    rateLimit: 999,
    maxKeys: 999,
    maxTokens: 32768,
    features: ["Tất cả model", "Unlimited", "Dedicated support", "Custom SLA"],
    cta: "Liên Hệ",
    popular: false,
  },
];

function formatPrice(price: number | null) {
  if (price === null) return "Liên hệ";
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export const metadata = {
  title: "Bảng Giá — MoraHub",
  description: "Chọn gói phù hợp với nhu cầu sử dụng API AI của bạn.",
};

export default function PricingPage() {
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            💰 Bảng Giá
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Chọn Gói <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Phù Hợp</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            Bắt đầu miễn phí, nâng cấp khi cần. Thanh toán theo nhu cầu, không phí ẩn.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col transition-all hover:shadow-lg ${
                  plan.popular
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg scale-[1.02]"
                    : "border-slate-100"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Phổ Biến
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{plan.displayName}</h3>
                  <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">{formatPrice(plan.price)}</span>
                  {plan.price !== null && plan.price > 0 && (
                    <span className="text-slate-500 text-sm">/tháng</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {plan.credits ? `${(plan.credits / 1000).toLocaleString()}K credits` : "Unlimited credits"}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {plan.maxKeys} API keys
                  </li>
                </ul>
                <Link
                  href={plan.name === "enterprise" ? "/dashboard/tickets" : "/register"}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-xl"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">Câu Hỏi Thường Gặp</h2>
          <div className="space-y-6">
            {[
              {
                q: "Credits được tính như thế nào?",
                a: "Mỗi request sẽ trừ credits tương ứng với số tokens sử dụng. 1 credit = 1 token. Bạn có thể theo dõi usage real-time trên dashboard.",
              },
              {
                q: "Tôi có thể nâng/giảm gói bất cứ lúc nào?",
                a: "Có. Bạn có thể nâng cấp ngay lập tức và giảm giá theo tỷ lệ. Khi downgrade, credits còn lại vẫn được giữ.",
              },
              {
                q: "Thanh toán như thế nào?",
                a: "Hỗ trợ VietQR, chuyển khoản ngân hàng (MB Bank), MOMO, ZaloPay. Nạp tiền tự động, credits cộng ngay sau 1-2 phút.",
              },
              {
                q: "Model nào được hỗ trợ?",
                a: "Hiện tại hỗ trợ 16+ model: GPT-5.4/5.5, Claude 3.5, Gemini, DeepSeek V4 Pro, Grok 4.3, Qwen, GLM-4 và nhiều model khác.",
              },
              {
                q: "API có ổn định không?",
                a: "Uptime 99.9%, response < 100ms. Hệ thống tự động failover giữa các provider nếu có sự cố.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Bắt đầu miễn phí ngay</h2>
          <p className="text-white/80 mb-8">Nhận 10,000 credits khi đăng ký. Không cần thẻ tín dụng.</p>
          <Link
            href="/register"
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl text-base font-semibold hover:shadow-xl transition-all inline-flex items-center gap-2"
          >
            Đăng Ký Miễn Phí →
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
