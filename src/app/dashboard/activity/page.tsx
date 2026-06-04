"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CreditCard, Key, Shield, Settings, LogIn, LogOut, Filter } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  action: string;
  details: string;
  ip: string;
  createdAt: string;
}

const iconMap: Record<string, any> = {
  login: LogIn,
  logout: LogOut,
  deposit: CreditCard,
  api_call: Key,
  api_key: Key,
  settings: Settings,
  security: Shield,
  default: Clock,
};

const typeColors: Record<string, string> = {
  login: "bg-green-100 text-green-600",
  logout: "bg-slate-100 text-slate-600",
  deposit: "bg-blue-100 text-blue-600",
  api_call: "bg-purple-100 text-purple-600",
  api_key: "bg-orange-100 text-orange-600",
  settings: "bg-indigo-100 text-indigo-600",
  security: "bg-red-100 text-red-600",
};

export default function ActivityLogPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  async function fetchActivities() {
    try {
      const res = await fetch(`/api/activity?type=${filter}`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {} finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">📋 Lịch sử hoạt động</h1>

      <div className="flex gap-2 flex-wrap">
        {["all", "login", "deposit", "api_call", "api_key", "settings", "security"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}>
            {f === "all" ? "Tất cả" : f === "login" ? "Đăng nhập" : f === "deposit" ? "Nạp tiền" : f === "api_call" ? "Gọi API" : f === "api_key" ? "API Keys" : f === "settings" ? "Cài đặt" : "Bảo mật"}
          </button>
        ))}
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có hoạt động nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {activities.map(a => {
            const Icon = iconMap[a.type] || iconMap.default;
            return (
              <Card key={a.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[a.type] || typeColors.login}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{a.action}</p>
                    <p className="text-xs text-slate-400">{a.details}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleString("vi-VN")}</p>
                    {a.ip && <p className="text-[10px] text-slate-300">{a.ip}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
