"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Building2, CreditCard, Globe, Shield, Bell, Database, Zap, TestTube, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [tab, setTab] = useState("bank");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bank settings
  const [bankName, setBankName] = useState("VietcomBank");
  const [bankBin, setBankBin] = useState("970432");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [minDeposit, setMinDeposit] = useState("10000");
  const [depositNote, setDepositNote] = useState("MoraHub nap tien");

  // Site settings
  const [siteName, setSiteName] = useState("MoraHub");
  const [siteDesc, setSiteDesc] = useState("Nền tảng API AI hàng đầu Việt Nam");
  const [siteUrl, setSiteUrl] = useState("https://morahub.online");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportTelegram, setSupportTelegram] = useState("");

  // API settings
  const [ckeyApiKey, setCkeyApiKey] = useState("");
  const [ckeyBaseUrl, setCkeyBaseUrl] = useState("https://ckey.vn/v1");
  const [defaultRateLimit, setDefaultRateLimit] = useState("30");
  const [defaultCredits, setDefaultCredits] = useState("10000");

  // Notification settings
  const [notifyNewUser, setNotifyNewUser] = useState(true);
  const [notifyDeposit, setNotifyDeposit] = useState(true);
  const [notifyTicket, setNotifyTicket] = useState(true);

  // Referral & Verification settings
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [referralReward, setReferralReward] = useState("50000");
  const [signupCredit, setSignupCredit] = useState("0");
  const [telegramVerifyCredit, setTelegramVerifyCredit] = useState("50000");
  const [emailVerifyRequired, setEmailVerifyRequired] = useState(false);

  // MB Bank Auto-Deposit
  const [bankUsername, setBankUsername] = useState("");
  const [bankPassword, setBankPassword] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankActive, setBankActive] = useState(false);

  // API Test
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState("");
  const [testLatency, setTestLatency] = useState(0);

  const BANKS = [
    { id: "970432", name: "VietcomBank" }, { id: "970407", name: "Techcombank" },
    { id: "970418", name: "BIDV" }, { id: "970405", name: "Agribank" },
    { id: "970422", name: "MB Bank" }, { id: "970416", name: "ACB" },
    { id: "970403", name: "Sacombank" },
  ];

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      if (d.bankName) { setBankName(d.bankName); setBankBin(d.bankBin); setAccountNo(d.accountNo); setAccountName(d.accountName); setMinDeposit(String(d.minDeposit || 10000)); setDepositNote(d.depositNote || "MoraHub nap tien"); }
      if (d.siteName) { setSiteName(d.siteName); setSiteDesc(d.siteDesc || ""); setSiteUrl(d.siteUrl || ""); }
      if (d.supportEmail !== undefined) setSupportEmail(d.supportEmail || "");
      if (d.supportTelegram !== undefined) setSupportTelegram(d.supportTelegram || "");
      if (d.ckeyApiKey !== undefined) setCkeyApiKey(d.ckeyApiKey || "");
      if (d.ckeyBaseUrl) setCkeyBaseUrl(d.ckeyBaseUrl);
      if (d.defaultRateLimit) setDefaultRateLimit(String(d.defaultRateLimit));
      if (d.defaultCredits) setDefaultCredits(String(d.defaultCredits));
      if (d.referralEnabled !== undefined) setReferralEnabled(d.referralEnabled);
      if (d.referralReward) setReferralReward(String(d.referralReward));
      if (d.signupCredit !== undefined) setSignupCredit(String(d.signupCredit));
      if (d.telegramVerifyCredit !== undefined) setTelegramVerifyCredit(String(d.telegramVerifyCredit));
      if (d.emailVerifyRequired !== undefined) setEmailVerifyRequired(d.emailVerifyRequired);
      if (d.bankUsername) setBankUsername(d.bankUsername);
      if (d.bankAccountNumber) setBankAccountNumber(d.bankAccountNumber);
      if (d.bankActive !== undefined) setBankActive(d.bankActive);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName, bankBin, accountNo, accountName, minDeposit: parseInt(minDeposit) || 10000, depositNote,
          siteName, siteDesc, siteUrl, supportEmail, supportTelegram,
          ckeyApiKey, ckeyBaseUrl, defaultRateLimit: parseInt(defaultRateLimit) || 30, defaultCredits: parseInt(defaultCredits) || 10000,
          notifyNewUser, notifyDeposit, notifyTicket,
          referralEnabled, referralReward: parseInt(referralReward) || 50000,
          signupCredit: parseInt(signupCredit) || 0,
          telegramVerifyCredit: parseInt(telegramVerifyCredit) || 50000,
          emailVerifyRequired,
          bankUsername,
          bankPassword: bankPassword || undefined,
          bankAccountNumber,
          bankActive,
        }),
      });
      if (res.ok) toast.success("Đã lưu cài đặt!");
      else toast.error("Lỗi lưu");
    } catch { toast.error("Lỗi"); }
    setSaving(false);
  }

  async function testCkeyApi() {
    if (!ckeyApiKey) { toast.error("Nhập API key trước"); return; }
    setTestStatus("loading");
    const start = Date.now();
    try {
      const res = await fetch(`${ckeyBaseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ckeyApiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Say hi" }], max_tokens: 10 }),
      });
      const data = await res.json();
      setTestLatency(Date.now() - start);
      if (res.ok && data.choices) { setTestStatus("success"); setTestResult("OK - " + data.choices[0]?.message?.content); }
      else { setTestStatus("error"); setTestResult(data.error?.message || JSON.stringify(data)); }
    } catch (e: any) { setTestStatus("error"); setTestResult(e.message); setTestLatency(Date.now() - start); }
  }

  const tabs = [
    { id: "bank", label: "Ngân hàng", icon: Building2 },
    { id: "site", label: "Website", icon: Globe },
    { id: "api", label: "API Backend", icon: Zap },
    { id: "defaults", label: "Mặc định", icon: CreditCard },
    { id: "notify", label: "Thông báo", icon: Bell },
    { id: "rewards", label: "Thưởng & Giới thiệu", icon: CreditCard },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Cài Đặt Hệ Thống</h1>
        <p className="text-slate-500 mt-1 text-sm">Quản lý cấu hình website, thanh toán, API</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-200"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Bank Settings */}
      {tab === "bank" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> Tài Khoản Ngân Hàng Nhận Tiền</h3>
          <p className="text-xs text-slate-500 mb-4">User sẽ chuyển khoản vào tài khoản này khi nạp tiền</p>
          <div className="space-y-4">
            <div><Label className="text-slate-700 font-medium text-sm">Ngân hàng</Label>
              <select value={bankBin} onChange={(e) => { const b = BANKS.find((x) => x.id === e.target.value); setBankBin(e.target.value); setBankName(b?.name || ""); }} className="w-full mt-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                {BANKS.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
              </select>
            </div>
            <div><Label className="text-slate-700 font-medium text-sm">Số tài khoản *</Label><Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="Nhập STK..." className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11 font-mono" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Tên chủ tài khoản</Label><Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="NGUYEN VAN A" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Số tiền tối thiểu (VND)</Label><Input type="number" value={minDeposit} onChange={(e) => setMinDeposit(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Nội dung CK mặc định</Label><Input value={depositNote} onChange={(e) => setDepositNote(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
          </div>
        </div>
      )}

      {/* Site Settings */}
      {tab === "site" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500" /> Cài Đặt Website</h3>
          <div className="space-y-4">
            <div><Label className="text-slate-700 font-medium text-sm">Tên website</Label><Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Mô tả</Label><Input value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">URL</Label><Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Email hỗ trợ</Label><Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@morahub.com" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Telegram hỗ trợ</Label><Input value={supportTelegram} onChange={(e) => setSupportTelegram(e.target.value)} placeholder="@ANIKTXV" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
          </div>
        </div>
      )}

      {/* API Backend */}
      {tab === "api" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> API Backend (ckey.vn)</h3>
            <p className="text-xs text-slate-500 mb-4">Cấu hình kết nối tới bên cung cấp API thứ 3</p>
            <div className="space-y-4">
              <div><Label className="text-slate-700 font-medium text-sm">API Key</Label><Input type="password" value={ckeyApiKey} onChange={(e) => setCkeyApiKey(e.target.value)} placeholder="sk-..." className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11 font-mono" /></div>
              <div><Label className="text-slate-700 font-medium text-sm">Base URL</Label><Input value={ckeyBaseUrl} onChange={(e) => setCkeyBaseUrl(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11 font-mono" /></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><TestTube className="w-5 h-5 text-purple-500" /> Test Kết Nối</h3>
            <div className="flex items-center gap-3 mb-3">
              <Button onClick={testCkeyApi} disabled={testStatus === "loading" || !ckeyApiKey} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold">
                {testStatus === "loading" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                {testStatus === "loading" ? "Đang test..." : "Test API Backend"}
              </Button>
              {testLatency > 0 && <span className="text-xs text-slate-500">{testLatency}ms</span>}
            </div>
            {testResult && (
              <div className={`p-3 rounded-xl text-sm ${testStatus === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                <div className="flex items-center gap-2">{testStatus === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{testResult}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Defaults */}
      {tab === "defaults" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-500" /> Cài Đặt Mặc Định</h3>
          <div className="space-y-4">
            <div><Label className="text-slate-700 font-medium text-sm">Rate Limit mặc định (req/phút)</Label><Input type="number" value={defaultRateLimit} onChange={(e) => setDefaultRateLimit(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
            <div><Label className="text-slate-700 font-medium text-sm">Credits mặc định (VND)</Label><Input type="number" value={defaultCredits} onChange={(e) => setDefaultCredits(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === "notify" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Cài Đặt Thông Báo</h3>
          <div className="space-y-3">
            {[
              { label: "Thông báo đăng ký mới", desc: "Khi có user mới tạo tài khoản", val: notifyNewUser, set: setNotifyNewUser },
              { label: "Thông báo nạp tiền", desc: "Khi có giao dịch nạp tiền mới", val: notifyDeposit, set: setNotifyDeposit },
              { label: "Thông báo ticket mới", desc: "Khi có ticket hỗ trợ mới", val: notifyTicket, set: setNotifyTicket },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div><div className="text-sm font-medium text-slate-900">{n.label}</div><div className="text-xs text-slate-500">{n.desc}</div></div>
                <button onClick={() => n.set(!n.val)} className={`w-12 h-6 rounded-full transition-all ${n.val ? "bg-indigo-500" : "bg-slate-300"}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${n.val ? "translate-x-6" : "translate-x-0.5"}`} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards & Referral Settings */}
      {tab === "rewards" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-500" /> Thưởng & Giới Thiệu</h3>
          <div className="space-y-4">
            {/* Referral */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div><div className="text-sm font-medium text-slate-900">Tính năng Giới thiệu bạn bè</div><div className="text-xs text-slate-500">Bật/tắt hệ thống referral</div></div>
                <button onClick={() => setReferralEnabled(!referralEnabled)} className={`w-12 h-6 rounded-full transition-all ${referralEnabled ? "bg-indigo-500" : "bg-slate-300"}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${referralEnabled ? "translate-x-6" : "translate-x-0.5"}`} /></button>
              </div>
              {referralEnabled && (
                <div><Label className="text-slate-700 font-medium text-sm">Thưởng cho người giới thiệu (VND)</Label><Input type="number" value={referralReward} onChange={(e) => setReferralReward(e.target.value)} className="bg-white border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" /></div>
              )}
            </div>
            {/* Signup Credit */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <Label className="text-slate-700 font-medium text-sm">Credit tặng khi đăng ký tài khoản mới</Label>
              <Input type="number" value={signupCredit} onChange={(e) => setSignupCredit(e.target.value)} className="bg-white border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
              <p className="text-xs text-slate-500 mt-1">Đặt 0 nếu không muốn tặng credit khi đăng ký</p>
            </div>
            {/* Telegram Verify Credit */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <Label className="text-slate-700 font-medium text-sm">Credit tặng khi xác minh Telegram</Label>
              <Input type="number" value={telegramVerifyCredit} onChange={(e) => setTelegramVerifyCredit(e.target.value)} className="bg-white border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
              <p className="text-xs text-slate-500 mt-1">User cần liên kết Telegram để nhận thưởng</p>
            </div>
            {/* Email Verify */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div><div className="text-sm font-medium text-slate-900">Yêu cầu xác minh email</div><div className="text-xs text-slate-500">User phải xác minh email mới sử dụng được</div></div>
                <button onClick={() => setEmailVerifyRequired(!emailVerifyRequired)} className={`w-12 h-6 rounded-full transition-all ${emailVerifyRequired ? "bg-indigo-500" : "bg-slate-300"}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${emailVerifyRequired ? "translate-x-6" : "translate-x-0.5"}`} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MB Bank Auto-Deposit */}
      {tab === "bank" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> 🏦 MB Bank Auto-Deposit</h3>
          <p className="text-xs text-slate-500 mb-4">Tự động check giao dịch MB Bank mỗi 30 giây. Match reference <code>MORAxxxxxx</code> → auto cộng credit.</p>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 font-medium text-sm">Tên đăng nhập MB Bank</Label>
              <Input value={bankUsername} onChange={(e) => setBankUsername(e.target.value)} placeholder="Số điện thoại hoặc username" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-slate-700 font-medium text-sm">Mật khẩu MB Bank</Label>
              <Input type="password" value={bankPassword} onChange={(e) => setBankPassword(e.target.value)} placeholder="Để trống nếu không đổi" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-slate-700 font-medium text-sm">Số tài khoản nhận tiền</Label>
              <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Số tài khoản MB Bank" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">Tự động check giao dịch</div>
                  <div className="text-xs text-slate-500">Mỗi 30 giây • Match ref MORAxxxxxx</div>
                </div>
                <button onClick={() => setBankActive(!bankActive)} className={`w-12 h-6 rounded-full transition-all ${bankActive ? "bg-green-500" : "bg-slate-300"}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${bankActive ? "translate-x-6" : "translate-x-0.5"}`} /></button>
              </div>
            </div>
            {bankActive && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="text-sm text-green-700">
                  ✅ Auto-deposit đang hoạt động<br/>
                  📡 Cron job check mỗi 30 giây<br/>
                  🔄 Session cache 5 phút (không login lại mỗi lần)
                </div>
                <button onClick={async () => {
                  const res = await fetch("/api/bank/balance");
                  const data = await res.json();
                  if (data.ok) {
                    const accounts = data.accounts?.map((a: any) => `${a.name} (${a.number}): ${Number(a.balance).toLocaleString("vi-VN")} ${a.currency}`).join("\n");
                    alert(`💰 Số dư MB Bank:\n\nTổng: ${Number(data.totalBalance).toLocaleString("vi-VN")} ${data.currency}\n\n${accounts || ""}`);
                  } else {
                    alert(data.error || "Lỗi lấy số dư");
                  }
                }} className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                  💰 Xem số dư MB Bank
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Button onClick={save} disabled={saving} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold h-12 text-base shadow-lg shadow-indigo-200/50">
        <Save className="w-4 h-4 mr-2" /> {saving ? "Đang lưu..." : "Lưu Tất Cả"}
      </Button>
    </div>
  );
}
