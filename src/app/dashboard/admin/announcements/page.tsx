"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, X, Megaphone, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: "bg-blue-100 text-blue-600" },
  warning: { icon: AlertTriangle, color: "bg-orange-100 text-orange-600" },
  maintenance: { icon: AlertCircle, color: "bg-red-100 text-red-600" },
};

export default function AdminAnnouncementsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "info" });

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchAnnouncements();
  }, [user]);

  async function fetchAnnouncements() {
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {} finally { setLoading(false); }
  }

  async function saveAnnouncement() {
    try {
      await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ title: "", content: "", type: "info" });
      await fetchAnnouncements();
    } catch {}
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("Xóa announcement này?")) return;
    try {
      await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchAnnouncements();
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">📢 Announcements</h1>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Tạo mới
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Tạo Announcement</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Tiêu đề"
              className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm" />
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Nội dung" rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm resize-none" />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm">
              <option value="info">ℹ️ Info</option>
              <option value="warning">⚠️ Warning</option>
              <option value="maintenance">🔧 Maintenance</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={saveAnnouncement} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"><Save className="w-4 h-4 mr-1" /> Đăng</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline"><X className="w-4 h-4 mr-1" /> Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {announcements.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">Chưa có announcement</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const config = typeConfig[a.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}><Icon className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color}`}>{a.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{a.content}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{new Date(a.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <Button onClick={() => deleteAnnouncement(a.id)} size="sm" variant="outline" className="text-red-600"><Trash2 className="w-3 h-3" /></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
