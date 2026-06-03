"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, Check } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(
      unread.map((n) =>
        fetch(`/api/notifications/${n.id}/read`, { method: "POST" })
      )
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const iconMap: Record<string, any> = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: XCircle,
  };

  const colorMap: Record<string, string> = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
  };

  const iconColorMap: Record<string, string> = {
    info: "text-blue-500",
    warning: "text-amber-500",
    success: "text-emerald-500",
    error: "text-red-500",
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Thông Báo</h1>
          <p className="text-slate-500 mt-1 text-sm">{notifications.filter((n) => !n.isRead).length} chưa đọc</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
            <Check className="w-4 h-4" /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const Icon = iconMap[n.type] || Info;
              return (
                <div key={n.id} className={`p-4 hover:bg-slate-50/50 transition-colors ${!n.isRead ? "bg-indigo-50/30" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colorMap[n.type] || colorMap.info} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${iconColorMap[n.type] || iconColorMap.info}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">{n.title}</h4>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      </div>
                      <p className="text-slate-600 text-sm mt-1">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString("vi-VN")}</span>
                        {!n.isRead && (
                          <button onClick={() => markAsRead(n.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
