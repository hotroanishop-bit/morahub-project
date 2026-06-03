"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket, Plus, Trash2, Copy, Check } from "lucide-react";

interface Coupon { id: string; code: string; discount: number; maxUses: number; usedCount: number; amount: number; expiresAt: string | null; isActive: boolean }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount: "10", maxUses: "100", amount: "10000", expiresAt: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/coupons").then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function addCoupon() {
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newCoupon, discount: parseInt(newCoupon.discount), maxUses: parseInt(newCoupon.maxUses), amount: parseFloat(newCoupon.amount), expiresAt: newCoupon.expiresAt || null }),
    });
    if (res.ok) {
      const d = await res.json();
      setCoupons(prev => [d, ...prev]);
      setShowAdd(false);
      setNewCoupon({ code: "", discount: "10", maxUses: "100", amount: "10000", expiresAt: "" });
      toast.success("Đã tạo coupon!");
    } else {
      const d = await res.json();
      toast.error(d.error || "Lỗi");
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Xác nhận xóa coupon?")) return;
    const res = await fetch("/api/admin/coupons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ couponId: id }) });
    if (res.ok) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success("Đã xóa!");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success("Đã copy!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Coupon</h1>
          <p className="text-slate-500 mt-1 text-sm">{coupons.length} coupon</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm">
          <Plus className="w-4 h-4 mr-1" />Tạo Coupon
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-lg">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Ticket className="w-5 h-5 text-indigo-500" /> Tạo Coupon Mới</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-slate-700 text-sm">Mã Coupon</Label><Input value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="SALE10K" className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm font-mono" /></div>
            <div><Label className="text-slate-700 text-sm">Giảm giá (%)</Label><Input type="number" value={newCoupon.discount} onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Số tiền nhận được (VND)</Label><Input type="number" value={newCoupon.amount} onChange={(e) => setNewCoupon({ ...newCoupon, amount: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Số lần sử dụng tối đa</Label><Input type="number" value={newCoupon.maxUses} onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
            <div><Label className="text-slate-700 text-sm">Ngày hết hạn (tùy chọn)</Label><Input type="date" value={newCoupon.expiresAt} onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-10 text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={addCoupon} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">Tạo Coupon</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Chưa có coupon nào</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {coupons.map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-bold text-slate-900 font-mono">{c.code}</code>
                    <button onClick={() => copyCode(c.code)} className="text-slate-400 hover:text-indigo-500">{copiedId === c.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                    <Badge className={`${c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"} text-[10px]`}>{c.isActive ? "Active" : "Disabled"}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Giảm {c.discount}% · Nhận {Number(c.amount).toLocaleString("vi-VN")}đ
                    {` · Đã dùng ${c.usedCount}/${c.maxUses}`}
                    {c.expiresAt && ` · Hết hạn ${new Date(c.expiresAt).toLocaleDateString("vi-VN")}`}
                  </div>
                </div>
                <button onClick={() => deleteCoupon(c.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
