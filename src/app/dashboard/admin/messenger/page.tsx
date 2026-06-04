"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Users, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";

export default function MessengerBroadcastPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState({ totalLinked: 0, totalUsers: 0 });

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchStats();
  }, [user]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/messenger/broadcast");
      const data = await res.json();
      setStats(data);
    } catch {}
  }

  async function handleBroadcast() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/messenger/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) setMessage("");
    } catch {} finally { setSending(false); }
  }

  if (user?.role !== "ADMIN") return <div className="text-center py-20 text-slate-400">Unauthorized</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">📢 Messenger Broadcast</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.totalLinked}</p>
            <p className="text-xs text-slate-400">User đã link Messenger</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-xs text-slate-400">Tổng users</p>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📝 Tin nhắn broadcast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Nhập tin nhắn muốn gửi đến tất cả user..."
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">{message.length}/1000 ký tự</p>
            <Button
              onClick={handleBroadcast}
              disabled={sending || !message.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Đang gửi..." : `Gửi đến ${stats.totalLinked} user`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="p-4">
            {result.success ? (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-800">Gửi thành công!</p>
                  <p className="text-xs text-green-600">
                    ✅ {result.sent} gửi thành功 • ❌ {result.failed} thất bại • 📊 {result.total} tổng
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">Gửi thất bại!</p>
                  <p className="text-xs text-red-600">{result.error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">⚡ Tin nhắn nhanh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            "🎉 MoraHub vừa có thêm model mới! Truy cập morahub.online để trải nghiệm ngay!",
            "📢 Maintenance scheduled: Hệ thống sẽ bảo trì lúc 2:00 AM ngày mai. Xin lỗi vì bất tiện!",
            "🔥 Flash sale! Nạp 100K được 120K credit. Áp dụng đến hết ngày mai!",
            "✅ Hệ thống đã hoạt động bình thường trở lại. Cảm ơn bạn đã kiên nhẫn!",
          ].map((msg, i) => (
            <button
              key={i}
              onClick={() => setMessage(msg)}
              className="w-full text-left p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-sm text-slate-600"
            >
              {msg}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
