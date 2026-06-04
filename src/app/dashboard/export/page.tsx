"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, CreditCard, Activity, Calendar } from "lucide-react";

export default function ExportPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [exporting, setExporting] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  async function exportData(type: string) {
    setExporting(type);
    try {
      const res = await fetch(`/api/export?type=${type}&period=${period}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {} finally { setExporting(null); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">📤 Xuất dữ liệu</h1>

      <div className="flex gap-2 mb-4">
        {["7d", "30d", "90d", "all"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}>
            {p === "7d" ? "7 ngày" : p === "30d" ? "30 ngày" : p === "90d" ? "90 ngày" : "Tất cả"}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        <Card className="hover:shadow-md transition cursor-pointer" onClick={() => exportData("transactions")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Giao dịch nạp tiền</h3>
              <p className="text-xs text-slate-400">Lịch sử nạp tiền, trạng thái, số tiền</p>
            </div>
            <Button size="sm" variant="outline" disabled={exporting === "transactions"}>
              <Download className="w-4 h-4 mr-1" />
              {exporting === "transactions" ? "Đang tải..." : "CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer" onClick={() => exportData("usage")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Lượt gọi API</h3>
              <p className="text-xs text-slate-400">Model, tokens, chi phí, thời gian</p>
            </div>
            <Button size="sm" variant="outline" disabled={exporting === "usage"}>
              <Download className="w-4 h-4 mr-1" />
              {exporting === "usage" ? "Đang tải..." : "CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer" onClick={() => exportData("billing")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Hóa đơn tổng hợp</h3>
              <p className="text-xs text-slate-400">Tổng chi phí theo ngày, theo model</p>
            </div>
            <Button size="sm" variant="outline" disabled={exporting === "billing"}>
              <Download className="w-4 h-4 mr-1" />
              {exporting === "billing" ? "Đang tải..." : "CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer" onClick={() => exportData("activity")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Lịch sử hoạt động</h3>
              <p className="text-xs text-slate-400">Đăng nhập, thay đổi cài đặt, bảo mật</p>
            </div>
            <Button size="sm" variant="outline" disabled={exporting === "activity"}>
              <Download className="w-4 h-4 mr-1" />
              {exporting === "activity" ? "Đang tải..." : "CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
