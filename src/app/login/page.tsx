"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      // Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      const { csrfToken } = await csrfRes.json();

      // Submit credentials
      const body = new URLSearchParams();
      body.set("csrfToken", csrfToken);
      body.set("email", email);
      body.set("password", password);
      body.set("callbackUrl", "https://morahub.online/dashboard");
      body.set("json", "true");

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "follow",
        credentials: "include",
      });

      // After redirect, check final URL
      const finalUrl = res.url || "";
      if (finalUrl.includes("error=") || finalUrl.includes("error")) {
        toast.error("Email hoặc mật khẩu không đúng");
        setLoading(false);
        return;
      }

      // Login succeeded — force reload
      toast.success("Đăng nhập thành công!");
      window.location.replace("https://morahub.online/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
      setLoading(false);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-[10%] w-72 h-72 bg-gradient-to-br from-pink-300/20 to-rose-300/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo-morahub.png" alt="MoraHub" className="w-12 h-12 rounded-2xl object-cover" />
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MoraHub</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-8 shadow-xl shadow-slate-200/50">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900">Đăng Nhập</h1>
            <p className="text-slate-500 text-sm mt-1">Chào mừng bạn quay lại</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-700 font-medium text-sm">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 pl-10 h-12 rounded-xl focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium text-sm">Mật Khẩu</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 pl-10 pr-10 h-12 rounded-xl focus:ring-2 focus:ring-indigo-100" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý...</span>
              ) : (
                <span className="flex items-center gap-2"><LogIn className="w-4 h-4" />Đăng Nhập <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Chưa có tài khoản? <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
