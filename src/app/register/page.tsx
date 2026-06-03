"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const passwordChecks = [
    { label: "Ít nhất 6 ký tự", valid: password.length >= 6 },
    { label: "Có chữ và số", valid: /[a-zA-Z]/.test(password) && /[0-9]/.test(password) },
    { label: "Mật khẩu khớp", valid: password === confirmPassword && password.length > 0 },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, referralCode: referralCode || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Đăng ký thành công! 🎉 Đang chuyển hướng...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        toast.error(data.error || "Đăng ký thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-[10%] w-72 h-72 bg-gradient-to-br from-pink-300/30 to-rose-300/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/logo-morahub.png" alt="MoraHub" className="w-11 h-11 rounded-xl object-cover" />
            <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MoraHub</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Tạo Tài Khoản</h1>
          <p className="text-slate-500">Bắt đầu sử dụng API AI ngay hôm nay</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-slate-700 text-sm font-semibold">Họ và tên</Label>
              <Input
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 mt-2 h-12 rounded-xl focus:border-indigo-400 focus:ring-indigo-100"
                required
              />
            </div>
            <div>
              <Label className="text-slate-700 text-sm font-semibold">Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 mt-2 h-12 rounded-xl focus:border-indigo-400 focus:ring-indigo-100"
                required
              />
            </div>
            <div>
              <Label className="text-slate-700 text-sm font-semibold">Mật khẩu</Label>
              <div className="relative mt-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 h-12 rounded-xl focus:border-indigo-400 focus:ring-indigo-100 pr-12"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-slate-700 text-sm font-semibold">Xác nhận mật khẩu</Label>
              <div className="relative mt-2">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 h-12 rounded-xl focus:border-indigo-400 focus:ring-indigo-100 pr-12"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="space-y-1.5">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${check.valid ? "bg-emerald-100" : "bg-slate-100"}`}>
                      {check.valid && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <span className={check.valid ? "text-emerald-600 font-medium" : "text-slate-400"}>{check.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label className="text-slate-700 text-sm font-semibold">Mã giới thiệu (tùy chọn)</Label>
              <Input
                type="text"
                placeholder="Nhập mã referral"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="bg-slate-50 border-slate-200 text-slate-900 mt-2 h-12 rounded-xl focus:border-indigo-400 focus:ring-indigo-100 font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-semibold shadow-lg shadow-indigo-200 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng ký...
                </span>
              ) : "Tạo Tài Khoản"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400 font-medium">hoặc</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-medium"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng Ký Với Google
          </Button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
