import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Users, DollarSign, Key, AlertTriangle, Settings, Database, Cpu, FileText } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  let stats = { totalUsers: 0, activeUsers: 0, totalModels: 0, activeModels: 0, totalKeys: 0, activeKeys: 0, pendingTxs: 0, completedTxs: 0, totalRevenue: 0, recentTxs: [] as any[] };

  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return <div className="text-center py-20 text-slate-500">Không có quyền truy cập</div>;
    }

    const [totalUsers, activeUsers, totalModels, activeModels, totalKeys, activeKeys, pendingTxs, completedTxs, totalRevenue, recentTxs] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      prisma.aiModel.count().catch(() => 0),
      prisma.aiModel.count({ where: { isActive: true } }).catch(() => 0),
      prisma.apiKey.count().catch(() => 0),
      prisma.apiKey.count({ where: { isActive: true } }).catch(() => 0),
      prisma.transaction.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.transaction.count({ where: { status: "COMPLETED" } }).catch(() => 0),
      prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.transaction.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []),
    ]);

    stats = { totalUsers, activeUsers, totalModels, activeModels, totalKeys, activeKeys, pendingTxs, completedTxs, totalRevenue: Number(totalRevenue._sum.amount || 0), recentTxs };
  } catch (e) {
    console.error("Admin stats error:", e);
  }

  const cards = [
    { label: "Người Dùng", value: stats.totalUsers.toString(), sub: `${stats.activeUsers} active`, icon: Users, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Doanh Thu", value: `${stats.totalRevenue.toLocaleString("vi-VN")}đ`, sub: `${stats.completedTxs} giao dịch`, icon: DollarSign, bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Models", value: stats.totalModels.toString(), sub: `${stats.activeModels} active`, icon: Cpu, bg: "bg-indigo-50", text: "text-indigo-600" },
    { label: "API Keys", value: stats.totalKeys.toString(), sub: `${stats.activeKeys} active`, icon: Key, bg: "bg-amber-50", text: "text-amber-600" },
  ];

  const quickLinks = [
    { label: "Users", href: "/admin/users", icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "Models", href: "/admin/models", icon: Cpu, color: "from-indigo-500 to-purple-500" },
    { label: "Giao Dịch", href: "/admin/transactions", icon: DollarSign, color: "from-emerald-500 to-green-500" },
    { label: "API Keys", href: "/admin/keys", icon: Key, color: "from-pink-500 to-rose-500" },
    { label: "Cài Đặt", href: "/admin/settings", icon: Settings, color: "from-amber-500 to-orange-500" },
    { label: "Hỗ Trợ", href: "/admin/tickets", icon: FileText, color: "from-violet-500 to-purple-500" },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Quản lý hệ thống MoraHub</p>
      </div>

      {stats.pendingTxs > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm text-amber-700 font-medium">{stats.pendingTxs} giao dịch đang chờ xử lý</span>
          <Link href="/admin/transactions" className="ml-auto text-sm font-semibold text-amber-600 hover:underline">Xem →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 lg:p-5">
            <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-xl ${s.bg} flex items-center justify-center mb-2`}><s.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${s.text}`} /></div>
            <div className="text-xs lg:text-sm text-slate-500 font-medium">{s.label}</div>
            <div className="text-lg lg:text-2xl font-extrabold text-slate-900 mt-0.5">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 lg:p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-500" /> Quản Lý Nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-center">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                <link.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600">{link.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /><h3 className="font-bold text-slate-900 text-sm lg:text-base">Giao Dịch Gần Đây</h3></div>
          <Link href="/admin/transactions" className="text-xs font-semibold text-indigo-600 hover:underline">Xem tất cả →</Link>
        </div>
        {stats.recentTxs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Chưa có giao dịch</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentTxs.map((tx) => (
              <div key={tx.id} className="px-4 lg:px-6 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{tx.user?.name || tx.user?.email || "Unknown"}</div>
                  <div className="text-xs text-slate-500">{tx.paymentMethod} · {new Date(tx.createdAt).toLocaleDateString("vi-VN")}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-900">{Number(tx.amount).toLocaleString("vi-VN")}đ</div>
                  <div className={`text-xs font-medium ${tx.status === "COMPLETED" ? "text-emerald-600" : tx.status === "PENDING" ? "text-amber-600" : "text-red-600"}`}>{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
