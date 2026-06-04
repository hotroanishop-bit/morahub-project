"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Copy, Check } from "lucide-react";

export default function SecurityPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/profile/2fa");
      const data = await res.json();
      setTwoFactorEnabled(data.enabled);
    } catch {} finally { setLoading(false); }
  }

  async function enable2FA() {
    try {
      const res = await fetch("/api/profile/2fa", { method: "POST" });
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch {}
  }

  async function verify2FA() {
    try {
      const res = await fetch("/api/profile/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, secret }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFactorEnabled(true);
        setQrCode("");
        setSecret("");
      }
    } catch {}
  }

  async function disable2FA() {
    try {
      await fetch("/api/profile/2fa", { method: "DELETE" });
      setTwoFactorEnabled(false);
    } catch {}
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">🔒 Bảo mật</h1>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Xác thực 2 yếu tố (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorEnabled ? (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-green-700 font-medium">✅ 2FA đã bật</p>
              <p className="text-sm text-green-600 mt-1">Tài khoản của bạn được bảo vệ bởi 2FA</p>
              <Button onClick={disable2FA} className="mt-3 bg-red-500 hover:bg-red-600 text-white" size="sm">Tắt 2FA</Button>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
              </div>
              <div className="p-3 bg-slate-100 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Secret key (lưu lại):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono break-all">{secret}</code>
                  <button onClick={copySecret} className="text-slate-400 hover:text-slate-600">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nhập mã từ app:</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)}
                  placeholder="000000" className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" />
              </div>
              <Button onClick={verify2FA} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white" disabled={!code}>Xác nhận</Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-3">Bảo vệ tài khoản với mã xác thực từ app (Google Authenticator, Authy...)</p>
              <Button onClick={enable2FA} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">Bật 2FA</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📜 Lịch sử đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Tính năng đang phát triển...</p>
        </CardContent>
      </Card>
    </div>
  );
}
