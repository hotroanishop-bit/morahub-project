"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Star, Zap, Crown, Building2, ArrowRight, CreditCard } from "lucide-react";

interface Plan {
  id: string; name: string; description: string | null; price: number;
  credits: number; rateLimit: number; maxKeys: number; maxTokens: number | null;
  features: string[];
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/subscription").then((r) => r.json()),
    ]).then(([plansData, subData]) => {
      setPlans(plansData.plans || []);
      setCurrentPlanId(subData.currentPlan?.id || null);
      setCredits(subData.credits || 0);
    }).finally(() => setLoading(false));
  }, []);

  async function upgrade(planId: string, planName: string, price: number) {
    if (currentPlanId === planId) return;
    if (price > credits) {
      toast.error("Không đủ credits! Vui lòng nạp thêm.");
      return;
    }
    if (!confirm(`Upgrade lên gói ${planName} với ${price.toLocaleString("vi-VN")}đ credits?`)) return;
    
    setUpgrading(planId);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setCurrentPlanId(planId);
        setCredits((prev) => prev - price);
      } else {
        toast.error(data.error || "Lỗi upgrade");
      }
    } catch { toast.error("Lỗi kết nối"); }
    setUpgrading(null);
  }

  const planIcons: Record<string, any> = { "Miễn Phí": Star, "Cơ Bản": Zap, "Chuyên Nghiệp": Crown, "Doanh Nghiệp": Building2 };
  const planColors: Record<string, string> = { "Miễn Phí": "from-slate-400 to-slate-500", "Cơ Bản": "from-blue-500 to-cyan-500", "Chuyên Nghiệp": "from-purple-500 to-indigo-500", "Doanh Nghiệp": "from-amber-500 to-orange-500" };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="text-center">
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Gói Cước</h1>
        <p className="text-slate-500 mt-1 text-sm">Chọn gói phù hợp với nhu cầu của bạn</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
          <CreditCard className="w-4 h-4 text-indigo-500" />
          <span className="text-sm text-slate-700">Credits hiện có:</span>
          <span className="font-bold text-indigo-600">{credits.toLocaleString("vi-VN")}đ</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const Icon = planIcons[plan.name] || Star;
            const isCurrent = currentPlanId === plan.id;
            const isUpgrade = plans.findIndex((p) => p.id === plan.id) > plans.findIndex((p) => p.id === currentPlanId);

            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-5 transition-all ${isCurrent ? "border-indigo-500 shadow-lg shadow-indigo-100/50" : "border-slate-100 hover:border-indigo-200"}`}>
                {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">HIỆN TẠI</div>}
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${planColors[plan.name] || "from-indigo-500 to-purple-500"} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="font-extrabold text-slate-900 text-lg">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <div className="text-3xl font-extrabold text-slate-900">Free</div>
                  ) : (
                    <div>
                      <span className="text-3xl font-extrabold text-slate-900">{(plan.price / 1000).toFixed(0)}K</span>
                      <span className="text-slate-500 text-sm ml-1">credits</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mb-5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600"><Check className="w-4 h-4 text-emerald-500" /> {plan.credits === -1 ? "Unlimited" : plan.credits.toLocaleString("vi-VN")} credits</div>
                  <div className="flex items-center gap-2 text-slate-600"><Check className="w-4 h-4 text-emerald-500" /> {plan.rateLimit} req/phút</div>
                  <div className="flex items-center gap-2 text-slate-600"><Check className="w-4 h-4 text-emerald-500" /> {plan.maxKeys === 999 ? "∞" : plan.maxKeys} API Keys</div>
                  {plan.maxTokens && <div className="flex items-center gap-2 text-slate-600"><Check className="w-4 h-4 text-emerald-500" /> {plan.maxTokens.toLocaleString()} tokens/lần</div>}
                </div>
                
                <Button
                  onClick={() => upgrade(plan.id, plan.name, plan.price)}
                  disabled={isCurrent || upgrading === plan.id}
                  className={`w-full rounded-xl font-semibold ${isCurrent ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg"}`}
                >
                  {isCurrent ? "Đang dùng" : upgrading === plan.id ? "Đang upgrade..." : "Chọn Gói"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
