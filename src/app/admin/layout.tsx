"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, Cpu, ArrowLeftRight, LogOut, Shield, Menu, X, Settings, Key, Bell, BarChart3, Megaphone } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người Dùng", icon: Users },
  { href: "/admin/models", label: "Models", icon: Cpu },
  { href: "/admin/keys", label: "API Keys", icon: Key },
  { href: "/admin/transactions", label: "Giao Dịch", icon: ArrowLeftRight },
  { href: "/admin/tickets", label: "Ticket", icon: Bell },
  { href: "/admin/notifications", label: "Thông Báo", icon: Bell },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/analytics", label: "Revenue", icon: BarChart3 },
  { href: "/admin/settings", label: "Cài Đặt", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm transform transition-transform duration-200 lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-rose-200/50"><Shield className="w-4 h-4" /></div>
            <span className="text-lg font-bold text-slate-900">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 ml-auto"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-100/80 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}>
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-rose-500" : ""}`} />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-0.5">
          <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"><LayoutDashboard className="w-[18px] h-[18px]" />Về Dashboard</Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 w-full font-medium"><LogOut className="w-[18px] h-[18px]" />Đăng Xuất</button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-1"><Menu className="w-6 h-6" /></button>
          <div className="ml-auto"><ThemeToggle /></div>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white">A</div>
            <span className="font-bold text-slate-900">Admin Panel</span>
          </div>
        </div>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
