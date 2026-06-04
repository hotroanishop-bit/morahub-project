"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Save, X, Package } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  rateLimit: number;
  maxKeys: number;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", price: "0", credits: "0", rateLimit: "10", maxKeys: "3" });

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchPlans();
  }, [user]);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {} finally { setLoading(false); }
  }

  async function savePlan() {
    try {
      if (editing) {
        await fetch("/api/admin/plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editing }),
        });
      } else {
        await fetch("/api/admin/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ name: "", price: "0", credits: "0", rateLimit: "10", maxKeys: "3" });
      await fetchPlans();
    } catch {}
  }

  async function deletePlan(id: string) {
    if (!confirm("Xóa plan này?")) return;
    try {
      await fetch("/api/admin/plans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchPlans();
    } catch {}
  }

  function startEdit(plan: Plan) {
    setForm({
      name: plan.name,
      price: String(plan.price),
      credits: String(plan.credits),
      rateLimit: String(plan.rateLimit),
      maxKeys: String(plan.maxKeys),
    });
    setEditing(plan.id);
    setShowCreate(true);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">📦 Quản lý Plans</h1>
        <Button onClick={() => { setShowCreate(true); setEditing(null); }} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Thêm Plan
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{editing ? "Sửa Plan" : "Thêm Plan mới"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Tên plan (Basic, Pro...)"
              className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Giá (VND/tháng)</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Credits</label>
                <input type="number" value={form.credits} onChange={e => setForm(p => ({ ...p, credits: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Rate Limit (req/phút)</label>
                <input type="number" value={form.rateLimit} onChange={e => setForm(p => ({ ...p, rateLimit: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max API Keys</label>
                <input type="number" value={form.maxKeys} onChange={e => setForm(p => ({ ...p, maxKeys: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={savePlan} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <Save className="w-4 h-4 mr-1" /> {editing ? "Lưu" : "Tạo"}
              </Button>
              <Button onClick={() => { setShowCreate(false); setEditing(null); }} variant="outline"><X className="w-4 h-4 mr-1" /> Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id} className="relative">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <div className="flex gap-1">
                  <Button onClick={() => startEdit(p)} size="sm" variant="outline" className="text-[10px] h-6"><Edit2 className="w-3 h-3" /></Button>
                  <Button onClick={() => deletePlan(p.id)} size="sm" variant="outline" className="text-[10px] h-6 text-red-600"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-600 mb-3">{Number(p.price).toLocaleString("vi-VN")}đ<span className="text-sm text-slate-400">/tháng</span></p>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600">💰 {Number(p.credits).toLocaleString("vi-VN")} credits</p>
                <p className="text-slate-600">⚡ {p.rateLimit} req/phút</p>
                <p className="text-slate-600">🔑 {p.maxKeys} API keys</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
