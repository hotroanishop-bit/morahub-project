"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, MessageSquare, Activity, TrendingUp, AlertTriangle, Clock, Shield } from "lucide-react";
import Link from "next/link";

interface OverviewData {
  stats: {
    totalUsers: number;
    totalRevenue: number;
    totalTransactions: number;
    openTickets: number;
    activeApiKeys: number;
    totalApiCalls: number;
  };
  recentActivity: { type: string; message: string; time: string }[];
  alerts: { type: string; message: string }[];
}

export default function AdminOverviewPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchOverview();
  }, [user]);

  async function fetchOverview() {
    try {
      const res = await fetch("/api/admin/overview");
      const d = await res.json();
      setData(d);
    } catch {} finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">🏠 Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/users">
          <Card className="hover:shadow-md transition cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Tổng Users</p>
                  <p className="text-2xl font-bold text-slate-900">{data?.stats?.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/analytics">
          <Card className="hover:shadow-md transition cursor-pointer border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Doanh thu</p>
                  <p className="text-2xl font-bold text-slate-900">{Number(data?.stats?.totalRevenue || 0).toLocaleString("vi-VN")}đ</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/tickets">
          <Card className="hover:shadow-md transition cursor-pointer border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Ticket mở</p>
                  <p className="text-2xl font-bold text-slate-900">{data?.stats?.openTickets || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/transactions">
          <Card className="hover:shadow-md transition cursor-pointer border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Giao dịch</p>
                  <p className="text-2xl font-bold text-slate-900">{data?.stats?.totalTransactions || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/models">
          <Card className="hover:shadow-md transition cursor-pointer border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">API Keys active</p>
                  <p className="text-2xl font-bold text-slate-900">{data?.stats?.activeApiKeys || 0}</p>
                </div>
                <Shield className="w-8 h-8 text-indigo-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/bi">
          <Card className="hover:shadow-md transition cursor-pointer border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">API Calls</p>
                  <p className="text-2xl font-bold text-slate-900">{data?.stats?.totalApiCalls || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle className="text-sm">⚡ Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/transactions" className="block p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700">
              💳 Quản lý giao dịch
            </Link>
            <Link href="/dashboard/admin/models" className="block p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700">
              🤖 Quản lý Models
            </Link>
            <Link href="/dashboard/admin/plans" className="block p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700">
              📦 Quản lý Plans
            </Link>
            <Link href="/dashboard/admin/announcements" className="block p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700">
              📢 Quản lý Announcements
            </Link>
            <Link href="/dashboard/admin/settings" className="block p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700">
              ⚙️ System Settings
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader><CardTitle className="text-sm">⚠️ Alerts</CardTitle></CardHeader>
          <CardContent>
            {data?.alerts && data.alerts.length > 0 ? (
              <div className="space-y-2">
                {data.alerts.map((a, i) => (
                  <div key={i} className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-orange-800">{a.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">✅ Không có alert nào</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
