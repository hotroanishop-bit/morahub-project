"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Gift, Plus, Trash2, Check } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
}

export default function CouponsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [newType, setNewType] = useState("PERCENT");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [newExpiry, setNewExpiry] = useState("30");
  const [redeemCode, setRedeemCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {} finally { setLoading(false); }
  }

  async function createCoupon() {
    try {
      await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          discount: parseFloat(newDiscount),
          
          maxUses: parseInt(newMaxUses),
          expiresInDays: parseInt(newExpiry),
        }),
      });
      setShowCreate(false);
      setNewCode("");
      setNewDiscount("");
      await fetchCoupons();
    } catch {}
  }

  async function deleteCoupon(id: string) {
    try {
      await fetch("/api/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: id }),
      });
      await fetchCoupons();
    } catch {}
  }

  async function redeemCoupon() {
    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Đã đổi coupon! +${Number(data.amount).toLocaleString("vi-VN")}đ`);
        setRedeemCode("");
      } else {
        setMessage(`❌ ${data.error || "Coupon không hợp lệ"}`);
      }
      setTimeout(() => setMessage(""), 5000);
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">🏷️ Coupon & Voucher</h1>

      {/* Redeem Section */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Đổi Coupon</h3>
          <div className="flex gap-2">
            <input type="text" value={redeemCode} onChange={e => setRedeemCode(e.target.value)}
              placeholder="Nhập mã coupon..." className="flex-1 px-4 py-2.5 bg-white border border-green-200 rounded-xl text-sm font-mono uppercase" />
            <Button onClick={redeemCoupon} className="bg-green-500 hover:bg-green-600 text-white" disabled={!redeemCode}>Đổi</Button>
          </div>
          {message && <p className="text-sm mt-2">{message}</p>}
        </CardContent>
      </Card>

      {/* Admin: Create Coupon */}
      {isAdmin && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Quản lý Coupon</h2>
            <Button onClick={() => setShowCreate(true)} size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <Plus className="w-4 h-4 mr-1" /> Tạo Coupon
            </Button>
          </div>

          {showCreate && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Tạo Coupon mới</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Mã coupon (VD: SALE20)"
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono uppercase" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} placeholder="Giá trị"
                    className="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
                    <option value="PERCENT">% Giảm</option>
                    <option value="FIXED">Số tiền cố định</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder="Lượt dùng tối đa"
                    className="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
                  <input type="number" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} placeholder="Ngày hết hạn"
                    className="px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createCoupon} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">Tạo</Button>
                  <Button onClick={() => setShowCreate(false)} variant="outline">Hủy</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Coupon List */}
      <div className="space-y-2">
        {coupons.map(c => (
          <Card key={c.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Ticket className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">{c.code}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">
                    {false ? `${c.discount}%` : `${Number(c.discount).toLocaleString("vi-VN")}đ`}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Đã dùng: {c.usedCount}/{c.maxUses} • Hết hạn: {new Date(c.expiresAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              {isAdmin && (
                <Button onClick={() => deleteCoupon(c.id)} size="sm" variant="outline" className="text-red-600">
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
