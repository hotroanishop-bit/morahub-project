"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, Send, Users, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);

  async function sendNotification() {
    if (!title || !message) { toast.error("Vui lòng nhập đầy đủ"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Đã gửi đến ${data.count} người dùng!`);
        setTitle(""); setMessage(""); setType("info");
      } else {
        toast.error("Lỗi gửi thông báo");
      }
    } catch { toast.error("Lỗi"); }
    setSending(false);
  }

  const presets = [
    { title: "Bảo trì hệ thống", message: "Hệ thống sẽ bảo trì từ 2:00 - 4:00 AM. Vui lòng lưu lại công việc.", type: "warning" },
    { title: "Tính năng mới", message: "Chúng tôi vừa thêm model GPT-4o Mini với giá ưu đãi!", type: "info" },
    { title: "Khuyến mãi", message: "Giảm 50% giá tất cả model trong tuần này!", type: "success" },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Thông Báo</h1>
        <p className="text-slate-500 mt-1 text-sm">Gửi thông báo đến tất cả người dùng</p>
      </div>

      {/* Send form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-indigo-500" /> Gửi Thông Báo</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 font-medium text-sm">Tiêu đề</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề..." className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-slate-700 font-medium text-sm">Nội dung</Label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nhập nội dung thông báo..." rows={4} className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none" />
          </div>
          <div>
            <Label className="text-slate-700 font-medium text-sm">Loại</Label>
            <div className="flex gap-2 mt-1.5">
              {[{ v: "info", l: "Info", icon: Info, color: "bg-blue-50 text-blue-700 border-blue-200" }, { v: "warning", l: "Warning", icon: AlertTriangle, color: "bg-amber-50 text-amber-700 border-amber-200" }, { v: "success", l: "Success", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" }, { v: "error", l: "Error", icon: XCircle, color: "bg-red-50 text-red-700 border-red-200" }].map((t) => (
                <button key={t.v} onClick={() => setType(t.v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${type === t.v ? t.color : "bg-white border-slate-200 text-slate-500"}`}><t.icon className="w-3 h-3" />{t.l}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500"><Users className="w-4 h-4 inline mr-1" />Gửi đến tất cả user</span>
            <Button onClick={sendNotification} disabled={sending} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">{sending ? "Đang gửi..." : "Gửi Thông Báo"}</Button>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-purple-500" /> Mẫu Thông Báo</h3>
        <div className="space-y-2">
          {presets.map((p, i) => (
            <button key={i} onClick={() => { setTitle(p.title); setMessage(p.message); setType(p.type); }} className="w-full text-left p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all">
              <div className="text-sm font-semibold text-slate-900">{p.title}</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{p.message}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
