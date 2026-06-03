"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Shield, Bell, Key, Save, Eye, EyeOff, AlertTriangle, CreditCard, Loader2, ExternalLink, Globe, MessageCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setProfile).catch(() => {});
  }, []);

  // API Keys
  const [keys, setKeys] = useState<any[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Telegram
  const [tgStatus, setTgStatus] = useState<any>(null);
  const [tgCode, setTgCode] = useState("");
  const [tgLoading, setTgLoading] = useState(false);
  const [tgCodeGenerated, setTgCodeGenerated] = useState(false);

  useEffect(() => {
    fetch("/api/keys").then((r) => r.json()).then((d) => setKeys(d.keys || [])).catch(() => {});
    fetch("/api/telegram/verify").then((r) => r.json()).then(setTgStatus).catch(() => {});
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) { toast.success("Đã lưu!"); await update({ name }); }
      else toast.error("Lỗi lưu");
    } catch { toast.error("Lỗi"); }
    setSaving(false);
  }

  async function changePassword() {
    if (newPw !== confirmPw) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    if (newPw.length < 6) { toast.error("Tối thiểu 6 ký tự"); return; }
    setChangingPw(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Đổi mật khẩu thành công!"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
      else toast.error(data.error || "Lỗi");
    } catch { toast.error("Lỗi"); }
    setChangingPw(false);
  }

  function copyKey(key: string) { navigator.clipboard.writeText(key); toast.success("Đã copy!"); }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Cài Đặt</h1>
        <p className="text-slate-500 mt-1 text-sm">Quản lý tài khoản, bảo mật và test API</p>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-3">
        <a href="/dashboard/keys" className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><Key className="w-5 h-5 text-indigo-500" /></div>
          <div><div className="font-bold text-slate-900 text-sm">API Keys</div><div className="text-xs text-slate-500">{keys.length} keys đang active</div></div>
          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
        </a>
        <a href="/dashboard/api-docs" className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Globe className="w-5 h-5 text-emerald-500" /></div>
          <div><div className="font-bold text-slate-900 text-sm">API Docs</div><div className="text-xs text-slate-500">Tài liệu tích hợp</div></div>
          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
        </a>
      </div>

      {/* Telegram Verification */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-500" /> Liên Kết Telegram</h3>
        <p className="text-xs text-slate-500 mb-4">Liên kết Telegram để nhận <b className="text-emerald-600">+50,000đ credit</b> miễn phí và quản lý tài khoản qua bot</p>
        
        {tgStatus?.telegramVerified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-sm font-medium text-emerald-800">Đã liên kết</div>
                <div className="text-xs text-emerald-600">Telegram ID: {tgStatus.telegramId}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
              onClick={async () => {
                if (!confirm("Hủy liên kết Telegram?")) return;
                const res = await fetch("/api/telegram/verify", { method: "DELETE" });
                if (res.ok) { setTgStatus({ telegramVerified: false, telegramId: null }); toast.success("Đã hủy liên kết"); }
              }}>
              Hủy liên kết
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-2">Cách liên kết:</div>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Mở Telegram, tìm bot <b>@MoraHubBot</b></li>
                <li>Nhấn <code>/start</code> để bắt đầu</li>
                <li>Nhấn nút bên dưới để lấy mã xác minh</li>
                <li>Gửi mã cho bot: <code>/verify MÃ</code></li>
              </ol>
            </div>
            {!tgCodeGenerated ? (
              <Button onClick={async () => {
                setTgLoading(true);
                const res = await fetch("/api/telegram/verify", { method: "POST" });
                const data = await res.json();
                if (data.ok) { setTgCode(data.code); setTgCodeGenerated(true); }
                else toast.error(data.error);
                setTgLoading(false);
              }} disabled={tgLoading}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold">
                {tgLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                {tgLoading ? "Đang tạo mã..." : "Lấy mã xác minh"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-xl">
                  <code className="text-xl font-mono font-bold text-emerald-400 tracking-widest">{tgCode}</code>
                  <Button size="sm" variant="ghost" className="ml-auto text-white hover:bg-white/10 rounded-lg"
                    onClick={() => { navigator.clipboard.writeText(tgCode); toast.success("Đã copy mã!"); }}>
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Mã hết hạn trong <b>10 phút</b>. Gửi cho bot: <code>/verify {tgCode}</code></p>
                <Button size="sm" variant="outline" className="rounded-xl text-xs"
                  onClick={() => { setTgCodeGenerated(false); setTgCode(""); }}>
                  Tạo mã mới
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> Hồ Sơ</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 font-medium text-sm">Họ và tên</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-slate-700 font-medium text-sm">Email</Label>
            <Input value={user?.email || ""} disabled className="bg-slate-100 border-slate-200 text-slate-500 mt-1.5 rounded-xl h-11 cursor-not-allowed" />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-500" /> Bảo Mật</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 font-medium text-sm">Mật khẩu hiện tại</Label>
            <div className="relative mt-1.5">
              <Input type={showPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11 pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <Label className="text-slate-700 font-medium text-sm">Mật khẩu mới</Label>
            <Input type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Tối thiểu 6 ký tự" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-slate-700 font-medium text-sm">Xác nhận mật khẩu mới</Label>
            <Input type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Nhập lại mật khẩu mới" className="bg-slate-50 border-slate-200 text-slate-900 mt-1.5 rounded-xl h-11" />
          </div>
          <Button onClick={changePassword} disabled={changingPw} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold">
            <Shield className="w-4 h-4 mr-2" /> {changingPw ? "Đang đổi..." : "Đổi Mật Khẩu"}
          </Button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-500" /> Thông Tin Tài Khoản</h3>
        <div className="space-y-3">
          {[
            { label: "Gói hiện tại", value: profile?.plan?.name || "Free", color: "text-indigo-600" },
            { label: "Credits", value: `${(profile?.credits || 0).toLocaleString("vi-VN")}đ`, color: "text-slate-900" },
            { label: "API Keys", value: `${keys.length}`, color: "text-slate-900" },
            { label: "Vai trò", value: user?.role === "ADMIN" ? "Admin" : "User", color: "text-slate-900" },
            { label: "Ngày tham gia", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "-", color: "text-slate-900" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className={`font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Thông Báo</h3>
        <a href="/dashboard/notifications" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors">
          <div><div className="text-sm font-medium text-slate-900">Xem thông báo</div><div className="text-xs text-slate-500">Thông báo từ hệ thống</div></div>
          <span className="text-slate-400">→</span>
        </a>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Vùng Nguy Hiểm</h3>
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-100">
          <div><div className="text-sm font-medium text-red-800">Xóa tài khoản</div><div className="text-xs text-red-600">Xóa vĩnh viễn tài khoản và dữ liệu</div></div>
          <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => toast.error("Liên hệ admin để xóa tài khoản")}>Xóa</Button>
        </div>
      </div>
    </div>
  );
}
