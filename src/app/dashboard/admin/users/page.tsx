"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Ban, CheckCircle, Search, Crown, UserCheck, UserX } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  creditBalance: number;
  createdAt: string;
  lastLoginAt: string;
  lastLoginIp: string;
  loginAttempts: number;
  twoFactorEnabled: boolean;
}

export default function UserManagementPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchUsers();
  }, [user]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {} finally { setLoading(false); }
  }

  async function updateRole(userId: string, role: string) {
    setUpdating(userId);
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "role", value: role }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch {} finally { setUpdating(null); }
  }

  async function toggleBan(userId: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "BANNED" : "ACTIVE";
    setUpdating(userId);
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "status", value: newStatus }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch {} finally { setUpdating(null); }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">👥 Quản lý Users</h1>
        <span className="text-sm text-slate-400">{users.length} users</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-xs font-medium text-slate-500">User</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Role</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Balance</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">2FA</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Last Login</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b hover:bg-slate-50 transition">
                    <td className="p-3">
                      <p className="text-sm font-medium text-slate-800">{u.name || "—"}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.status === "ACTIVE" ? "bg-green-100 text-green-600" : u.status === "BANNED" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm font-medium text-slate-800">
                      {Number(u.creditBalance).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3">
                      {u.twoFactorEnabled ? <Shield className="w-4 h-4 text-green-500" /> : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="p-3 text-xs text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {u.role !== "ADMIN" && (
                          <Button onClick={() => updateRole(u.id, "ADMIN")} size="sm" variant="outline" className="text-[10px] h-6"
                            disabled={updating === u.id}>
                            <Crown className="w-3 h-3" />
                          </Button>
                        )}
                        <Button onClick={() => toggleBan(u.id, u.status)} size="sm" variant="outline"
                          className={`text-[10px] h-6 ${u.status === "BANNED" ? "text-green-600" : "text-red-600"}`}
                          disabled={updating === u.id}>
                          {u.status === "BANNED" ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
