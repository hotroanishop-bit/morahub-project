"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Edit, Search, Shield, Ban, CheckCircle, CreditCard, UserPlus } from "lucide-react";

interface User { id: string; name: string | null; email: string; creditBalance: string; role: string; status: string; createdAt: string; _count: { apiKeys: number; usageLogs: number; transactions: number } }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editCredits, setEditCredits] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users || [])).finally(() => setLoading(false)); }, []);

  async function saveUser() {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editUser.id, creditBalance: editCredits, role: editRole, status: editStatus }),
      });
      if (res.ok) {
        toast.success("Đã cập nhật");
        setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, creditBalance: editCredits, role: editRole, status: editStatus } : u));
        setEditUser(null);
      } else {
        toast.error("Lỗi cập nhật");
      }
    } catch { toast.error("Lỗi"); }
    setSaving(false);
  }

  async function grantCredits(userId: string, amount: number) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, creditBalance: String(amount) }),
      });
      if (res.ok) { toast.success(`Đã cộng ${amount.toLocaleString()} credits`); setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, creditBalance: String(amount) } : u)); }
    } catch { toast.error("Lỗi"); }
  }

  const filtered = users.filter((u) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div><h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Người Dùng</h1><p className="text-slate-500 mt-1 text-sm">{users.length} người dùng</p></div>
        <div className="relative w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full lg:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div> : filtered.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">Không tìm thấy</div> : (
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <div key={u.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{u.name || "—"}</span>
                      <Badge className={u.role === "ADMIN" ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px]" : "bg-slate-100 text-slate-600 text-[10px]"}>{u.role}</Badge>
                      <Badge className={u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]" : "bg-red-50 text-red-700 border border-red-200 text-[10px]"}>{u.status}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                      <span className="font-bold text-indigo-600">{Number(u.creditBalance).toLocaleString()} credits</span>
                      <span>· {u._count.apiKeys} keys</span>
                      <span>· {u._count.usageLogs} calls</span>
                      <span>· {new Date(u.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => grantCredits(u.id, Number(u.creditBalance) + 10000)} className="text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs h-8"><CreditCard className="w-3 h-3 mr-1" />+10K</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditUser(u); setEditCredits(u.creditBalance); setEditRole(u.role); setEditStatus(u.status); }} className="text-indigo-600 hover:bg-indigo-50 rounded-xl h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="bg-white border-slate-200 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Sửa Người Dùng</DialogTitle>
            <p className="text-sm text-slate-500">{editUser?.email}</p>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-700 font-medium text-sm">Credits</Label><Input type="number" value={editCredits} onChange={(e) => setEditCredits(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Vai trò</Label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full mt-1.5 h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div><Label className="text-slate-700 font-medium text-sm">Trạng thái</Label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full mt-1.5 h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                <option value="ACTIVE">ACTIVE</option>
                <option value="BANNED">BANNED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditUser(null)} className="border-slate-200 rounded-xl">Hủy</Button>
            <Button onClick={saveUser} disabled={saving} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">{saving ? "..." : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
