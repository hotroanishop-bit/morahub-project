"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check, CheckCheck, CreditCard, MessageSquare, Key, AlertTriangle, Shield } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const iconMap: Record<string, any> = {
  DEPOSIT_SUCCESS: CreditCard,
  DEPOSIT_FAILED: AlertTriangle,
  TICKET_REPLY: MessageSquare,
  TICKET_RESOLVED: MessageSquare,
  API_KEY_EXPIRING: Key,
  LOW_CREDIT: AlertTriangle,
  LOGIN_NEW_DEVICE: Shield,
  SYSTEM: Bell,
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {} finally { setLoading(false); }
  }

  async function markAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: "all" }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">
          🔔 Thông báo {unreadCount > 0 && <span className="text-sm text-red-500">({unreadCount})</span>}
        </h1>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCheck className="w-4 h-4 mr-1" />
            Đọc tất cả
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có thông báo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <Card key={n.id} className={`cursor-pointer transition ${n.isRead ? "opacity-60" : "border-l-4 border-l-indigo-500"}`}
                onClick={() => !n.isRead && markAsRead(n.id)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${n.isRead ? "bg-slate-100" : "bg-indigo-100"}`}>
                    <Icon className={`w-5 h-5 ${n.isRead ? "text-slate-400" : "text-indigo-500"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${n.isRead ? "text-slate-600" : "text-slate-900"}`}>{n.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{new Date(n.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
