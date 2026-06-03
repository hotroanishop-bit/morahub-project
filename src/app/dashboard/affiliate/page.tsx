"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Copy, Check, Gift, TrendingUp, DollarSign } from "lucide-react";

interface AffiliateStats { referralCode: string; totalReferrals: number; totalEarned: number; pendingReward: number }

export default function AffiliatePage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/affiliate").then(r => r.json()).then(d => setStats(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!stats) return;
    const link = `https://morahub.online/register?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Đã copy link referral!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Giới Thiệu Bạn Bè</h1>
        <p className="text-slate-500 mt-1 text-sm">Chia sẻ link referral, nhận credit miễn phí</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : !stats ? (
        <div className="text-center py-12 text-slate-400 text-sm">Không có dữ liệu</div>
      ) : (
        <>
          {/* Referral Link */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Gift className="w-5 h-5" /> Link Giới Thiệu</h3>
            <p className="text-sm text-white/80 mb-4">Chia sẻ link này với bạn bè. Khi họ đăng ký, bạn nhận 10,000đ credit!</p>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl p-3">
              <code className="flex-1 text-sm font-mono truncate">https://morahub.online/register?ref={stats.referralCode}</code>
              <button onClick={copyLink} className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2"><Users className="w-5 h-5 text-blue-600" /></div>
              <div className="text-xs text-slate-500">Lời mời</div>
              <div className="text-xl font-extrabold text-slate-900">{stats.totalReferrals}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              <div className="text-xs text-slate-500">Đã nhận</div>
              <div className="text-xl font-extrabold text-slate-900">{stats.totalEarned.toLocaleString("vi-VN")}đ</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              <div className="text-xs text-slate-500">Chờ xử lý</div>
              <div className="text-xl font-extrabold text-slate-900">{stats.pendingReward.toLocaleString("vi-VN")}đ</div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Cách Thức Hoạt Động</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">1</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Chia sẻ link referral</div>
                  <div className="text-xs text-slate-500">Gửi link cho bạn bè qua mạng xã hội, email...</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">2</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Bạn bè đăng ký</div>
                  <div className="text-xs text-slate-500">Họ đăng ký tài khoản mới qua link của bạn</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">3</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Nhận thưởng</div>
                  <div className="text-xs text-slate-500">Bạn nhận 10,000đ credit cho mỗi lời mời thành công</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
