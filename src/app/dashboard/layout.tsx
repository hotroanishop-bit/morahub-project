"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, MessageCircle, Key, BarChart3, Wallet, Package, FileText, Settings, LogOut, Menu, X, Bell, Shield, Folder, Headphones, ArrowLeftRight, Cpu, Play, Users, Webhook, ClipboardList, MessageSquare, Clock, Download, Ticket, BookOpen, CreditCard } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import AnnouncementBanner from "@/components/announcement-banner";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Tổng Quan", icon: LayoutDashboard },
  { href: "/dashboard/keys", label: "API Keys", icon: Key },
  { href: "/dashboard/projects", label: "Dự Án", icon: Folder },
  { href: "/dashboard/models", label: "Models & Giá", icon: Cpu },
  { href: "/dashboard/usage", label: "Sử Dụng", icon: BarChart3 },
  { href: "/dashboard/top-up", label: "Nạp Tiền", icon: Wallet },
  { href: "/dashboard/support", label: "Hỗ Trợ Nạp Tiền", icon: Wallet },
  { href: "/dashboard/transactions", label: "Lịch Sử GD", icon: ArrowLeftRight },
  { href: "/dashboard/subscription", label: "Gói Cước", icon: Package },
  { href: "/dashboard/notifications", label: "Thông Báo", icon: Bell },
  { href: "/dashboard/ticket-chat", label: "Chat Ticket", icon: MessageSquare },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/activity", label: "Hoạt Động", icon: Clock },
  { href: "/dashboard/export", label: "Xuất Dữ Liệu", icon: Download },
  { href: "/dashboard/coupons", label: "Coupon", icon: Ticket },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/dashboard/docs", label: "API Docs", icon: BookOpen },
  { href: "/dashboard/tickets", label: "Hỗ Trợ", icon: Headphones },
  { href: "/dashboard/ticket-history", label: "Lịch sử hỗ trợ", icon: Clock },
  { href: "/dashboard/api-docs", label: "API Docs", icon: FileText },
  { href: "/dashboard/playground", label: "Playground", icon: Play },
  { href: "/dashboard/cost-alerts", label: "Cảnh Báo Chi Phí", icon: Bell },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/dashboard/request-logs", label: "Request Logs", icon: ClipboardList },
  { href: "/dashboard/affiliate", label: "Giới Thiệu", icon: Users },
  { href: "/dashboard/settings", label: "Cài Đặt", icon: Settings },
  { href: "/dashboard/security", label: "Bảo Mật", icon: Shield },
  { href: "/dashboard/notifications", label: "Thông Báo", icon: Bell },
  { href: "/dashboard/ticket-chat", label: "Chat Ticket", icon: MessageSquare },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/activity", label: "Hoạt Động", icon: Clock },
  { href: "/dashboard/export", label: "Xuất Dữ Liệu", icon: Download },
  { href: "/dashboard/coupons", label: "Coupon", icon: Ticket },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/dashboard/docs", label: "API Docs", icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm transform transition-transform duration-200 lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img src="/logo-morahub.png" alt="MoraHub" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-lg font-bold text-slate-900">MoraHub</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 ml-auto"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100/80 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}>
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-indigo-500" : ""}`} />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-0.5">
          {isAdmin && (
            <>
              <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 w-full font-medium"><Shield className="w-[18px] h-[18px]" />Quản Trị</Link>
              <Link href="/dashboard/admin/tickets" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-orange-600 hover:bg-orange-50 w-full font-medium"><MessageSquare className="w-[18px] h-[18px]" />🎫 Hỗ trợ</Link>
              <Link href="/dashboard/admin/users" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-purple-600 hover:bg-purple-50 w-full font-medium"><Users className="w-[18px] h-[18px]" />👥 Users</Link>
              <Link href="/dashboard/admin/bi" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 w-full font-medium"><BarChart3 className="w-[18px] h-[18px]" />📈 BI</Link>
              <Link href="/dashboard/admin/transactions" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 w-full font-medium"><CreditCard className="w-[18px] h-[18px]" />💳 Giao dịch</Link>
              <Link href="/dashboard/admin/models" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-green-600 hover:bg-green-50 w-full font-medium"><Cpu className="w-[18px] h-[18px]" />🤖 Models</Link>
              <Link href="/dashboard/admin/plans" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-purple-600 hover:bg-purple-50 w-full font-medium"><Package className="w-[18px] h-[18px]" />📦 Plans</Link>
              <Link href="/dashboard/admin/announcements" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-orange-600 hover:bg-orange-50 w-full font-medium"><FileText className="w-[18px] h-[18px]" />📢 Announcements</Link>
              <Link href="/dashboard/admin/messenger" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 w-full font-medium"><MessageCircle className="w-[18px] h-[18px]" />💬 Messenger Broadcast</Link>
            </>
          )}
          <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 w-full font-medium"><LogOut className="w-[18px] h-[18px]" />Đăng Xuất</button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-1"><Menu className="w-6 h-6" /></button>
          <div className="ml-auto"><ThemeToggle /></div>
          <div className="flex items-center gap-2 ml-3">
            <img src="/logo-morahub.png" alt="MoraHub" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-slate-900">MoraHub</span>
          </div>
        </div>
        <div className="p-4 lg:p-6"><AnnouncementBanner />{children}</div>
      </main>
    </div>
  );
}
