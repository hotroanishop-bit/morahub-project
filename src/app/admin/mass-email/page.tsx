"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Send, Users, Filter, Check } from "lucide-react";

export default function AdminMassEmailPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => { fetchUserCount(); }, [filter]);

  async function fetchUserCount() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    const users = data.users || [];
    let count = users.length;
    if (filter === "no-plan") count = users.filter((u: any) => !u.planId).length;
    if (filter === "with-plan") count = users.filter((u: any) => u.planId).length;
    if (filter === "low-credit") count = users.filter((u: any) => Number(u.creditBalance) < 10000).length;
    setUserCount(count);
  }

  async function send() {
    if (!subject.trim() || !body.trim()) { toast.error("Nhập tiêu đề và nội dung"); return; }
    if (!confirm(`Gửi đến ${userCount} người dùng?`)) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/mass-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, filter: filter === "all" ? null : filter }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setResult(data);
      toast.success(`Đã gửi đến ${data.recipientCount} người dùng!`);
      setSubject(""); setBody("");
    } catch { toast.error("Lỗi gửi"); }
    setSending(false);
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Mass Email</h1>
        <p className="text-slate-500 mt-1 text-sm">Gửi thông báo đến nhiều user cùng lúc</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tiêu đề</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ví dụ: Maintenance scheduled..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nội dung</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Nội dung thông báo..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>Gửi đến: <strong className="text-indigo-600">{userCount}</strong> người dùng</span>
            </div>
            <Button onClick={send} disabled={sending || !subject.trim() || !body.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
              <Send className="w-4 h-4 mr-1" /> {sending ? "Đang gửi..." : "Gửi"}
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" /> Đối tượng</h3>
          <div className="space-y-2">
            {[
              { id: "all", label: "Tất cả user", count: "all" },
              { id: "no-plan", label: "Chưa có plan", count: "no-plan" },
              { id: "with-plan", label: "Đang có plan", count: "with-plan" },
              { id: "low-credit", label: "Credit < 10K", count: "low-credit" },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${filter === f.id ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
                <span>{f.label}</span>
                {filter === f.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {result && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
              <p className="text-sm text-emerald-700 font-medium">✓ Đã gửi thành công</p>
              <p className="text-xs text-emerald-600 mt-1">{result.recipientCount} người dùng nhận được</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
