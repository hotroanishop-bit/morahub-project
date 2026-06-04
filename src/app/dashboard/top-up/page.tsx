"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wallet, Building2, Copy, CheckCircle, Clock, QrCode, ArrowLeft, RefreshCw } from "lucide-react";

interface SiteSettings { bankName: string; bankBin: string; accountNo: string; accountName: string; minDeposit: number; depositNote: string }

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

function TopUpContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [amount, setAmount] = useState(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  // Load existing transaction from ?ref=xxx
  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => { if (d.accountNo) setSettings(d); }).catch(() => {});
    fetch("/api/top-up").then((r) => r.json()).then((d) => {
      const txs = Array.isArray(d) ? d : d.transactions || [];
      setHistory(txs);
      // If ref param exists, find that transaction
      if (refParam) {
        const found = txs.find((t: any) => t.reference === refParam);
        if (found && (found.status === "PENDING" || found.status === "COMPLETED" || found.status === "FAILED")) {
          setTransaction(found);
        }
      }
    }).catch(() => {});
  }, [refParam]);

  const finalAmount = customAmount ? parseInt(customAmount) || 0 : amount;

  useEffect(() => {
    if (transaction && settings?.bankBin && settings?.accountNo) {
      const note = transaction.reference || "MORA";
      const url = `https://img.vietqr.io/image/${settings.bankBin}-${settings.accountNo}-compact2.png?amount=${transaction.amount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(settings.accountName || "HUYNH THE NGOC")}`;
      setQrUrl(url);
      // Update URL with ref so page can be reloaded
      if (transaction.reference && !refParam) {
        router.replace(`/dashboard/top-up?ref=${transaction.reference}`, { scroll: false });
      }
    }
  }, [transaction, settings, refParam, router]);

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}!`);
  }

  async function handleDeposit() {
    if (!finalAmount || finalAmount < (settings?.minDeposit || 10000)) { toast.error(`Số tiền tối thiểu ${(settings?.minDeposit || 10000).toLocaleString("vi-VN")}đ`); return; }
    if (!settings?.accountNo) { toast.error("Chưa cấu hình tài khoản nhận tiền"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, paymentMethod: "BANKING" }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setTransaction(data.transaction);
      toast.success("Tạo lệnh nạp tiền thành công!");
      // Redirect to ?ref=xxx so QR persists on reload
      router.replace(`/dashboard/top-up?ref=${data.transaction.reference}`, { scroll: false });
    } catch { toast.error("Lỗi kết nối"); }
    setSubmitting(false);
  }

  async function checkStatus() {
    if (!transaction) return;
    try {
      const res = await fetch("/api/top-up");
      const data = await res.json();
      const txs = Array.isArray(data) ? data : data.transactions || [];
      const tx = txs.find((t: any) => t.id === transaction.id);
      if (tx?.status === "COMPLETED") {
        setTransaction({ ...transaction, status: "COMPLETED" });
        toast.success("Nạp tiền thành công!");
      } else {
        toast.info("Đang chờ xử lý...");
      }
    } catch { toast.error("Lỗi kiểm tra"); }
  }

  function formatStatus(s: string) {
    const m: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Chờ xử lý", color: "text-amber-600 bg-amber-50" },
      COMPLETED: { label: "Thành công", color: "text-emerald-600 bg-emerald-50" },
      FAILED: { label: "Thất bại", color: "text-red-600 bg-red-50" },
    };
    return m[s] || { label: s, color: "text-slate-600 bg-slate-50" };
  }

  // Payment failed / expired
  if (transaction?.status === "FAILED") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⏰</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Giao Dịch Hết Hạn</h2>
        <p className="text-slate-500 mb-4">Mã CK <span className="font-mono font-semibold">{transaction.reference}</span> đã hết hạn (15 phút)</p>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-6 mb-6">
          <p className="text-sm text-red-600 mb-2">Nếu bạn đã chuyển khoản, vui lòng liên hệ hỗ trợ</p>
          <p className="text-2xl font-extrabold text-red-600">{transaction.amount?.toLocaleString("vi-VN")}đ</p>
        </div>
        <div className="flex gap-3 justify-center">
          <a href={`/dashboard/support?hotro=${transaction.reference}`} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm">💵 Hỗ Trợ Nạp Tiền</a>
          <Button onClick={() => { setTransaction(null); router.replace("/dashboard/top-up", { scroll: false }); }} variant="outline" className="rounded-xl">Nạp Lại</Button>
        </div>
      </div>
    );
  }

  // Payment success
  if (transaction?.status === "COMPLETED") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Nạp Tiền Thành Công!</h2>
        <p className="text-slate-500 mb-4">Số dư đã được cập nhật</p>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <div className="text-3xl font-extrabold text-emerald-600">{transaction.amount?.toLocaleString("vi-VN")}đ</div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setTransaction(null); router.replace("/dashboard/top-up", { scroll: false }); fetch("/api/admin/settings").then(r => r.json()).then(d => setSettings(d)); }} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">Nạp Thêm</Button>
          <a href="/dashboard" className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors">Về Dashboard</a>
        </div>
      </div>
    );
  }

  // Show QR
  if (transaction) {
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={() => { setTransaction(null); router.replace("/dashboard/top-up", { scroll: false }); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium mb-4">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-amber-600">Chờ thanh toán</span>
          </div>

          <div className="text-3xl font-extrabold text-slate-900 mb-6">{transaction.amount?.toLocaleString("vi-VN")}đ</div>

          {qrUrl && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block mb-6">
              <img src={qrUrl} alt="VietQR" className="w-64 h-64 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=vietqr://${settings?.bankBin}/${settings?.accountNo}/${transaction.amount}`; }} />
            </div>
          )}

          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-500">Ngân hàng</span>
              <span className="text-sm font-semibold text-slate-900">{settings?.bankName}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-500">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 font-mono">{settings?.accountNo}</span>
                <button onClick={() => copyText(settings?.accountNo || "", "số tài khoản")} className="text-slate-400 hover:text-indigo-500"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-500">Số tiền</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-indigo-600 font-mono">{transaction.amount?.toLocaleString("vi-VN")}đ</span>
                <button onClick={() => copyText(String(transaction.amount), "số tiền")} className="text-slate-400 hover:text-indigo-500"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-500">Nội dung CK</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 font-mono">{transaction.reference}</span>
                <button onClick={() => copyText(transaction.reference || "", "nội dung")} className="text-slate-400 hover:text-indigo-500"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">Quét QR hoặc chuyển khoản đúng nội dung. Hệ thống tự động xử lý trong 1-5 phút.</p>

          <div className="flex gap-3 mt-4">
            <a href={`/dashboard/support?hotro=${transaction.reference}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                💵 Hỗ Trợ Nạp Tiền
              </Button>
            </a>
            <Button onClick={async () => {
              try {
                await fetch("/api/top-up/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: transaction.id }) });
              } catch {}
              setTransaction(null);
              router.replace("/dashboard/top-up", { scroll: false });
            }} variant="outline" className="flex-1 rounded-xl text-red-500 border-red-200 hover:bg-red-50">Hủy</Button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Nạp Tiền</h1>
        <p className="text-slate-500 mt-1 text-sm">Nạp credit để sử dụng API</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Deposit form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-500" /> Chọn Số Tiền</h3>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {QUICK_AMOUNTS.map((a) => (
              <button key={a} onClick={() => { setAmount(a); setCustomAmount(""); }}
                className={`p-3 rounded-xl border text-sm font-semibold transition-all ${amount === a && !customAmount ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
                {a >= 1000000 ? `${a / 1000000}M` : `${a / 1000}K`}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Hoặc nhập số tiền</label>
            <div className="relative">
              <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="0" min={settings?.minDeposit || 10000}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 pr-12" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">VND</span>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-indigo-600">Số tiền nạp</span>
              <span className="text-xl font-extrabold text-indigo-700">{(customAmount ? parseInt(customAmount) || 0 : amount).toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          <Button onClick={handleDeposit} disabled={submitting} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold py-6 text-base">
            {submitting ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <QrCode className="w-5 h-5 mr-2" />}
            {submitting ? "Đang tạo..." : "Tạo QR Nạp Tiền"}
          </Button>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400" /> Lịch Sử Nạp Tiền</h3>
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Chưa có giao dịch</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.slice(0, 20).map((t) => {
                const st = formatStatus(t.status);
                return (
                  <div key={t.id} className={`flex items-center justify-between p-3 bg-slate-50 rounded-xl transition-colors ${t.status === "PENDING" || t.status === "FAILED" ? "cursor-pointer hover:bg-slate-100" : ""}`} onClick={() => { if (t.status === "PENDING" || t.status === "FAILED") { router.push(`/dashboard/top-up?ref=${t.reference}`); } }}>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{t.amount?.toLocaleString("vi-VN")}đ</div>
                      <div className="text-xs text-slate-400">{t.reference} • {new Date(t.createdAt).toLocaleString("vi-VN")}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TopUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <TopUpContent />
    </Suspense>
  );
}
