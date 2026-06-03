"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Eye, EyeOff, Info, AlertTriangle, Wrench } from "lucide-react";

interface Announcement { id: string; title: string; content: string; type: string; isActive: boolean; createdAt: string }

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  info: { label: "Info", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Info },
  warning: { label: "Warning", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  maintenance: { label: "Maintenance", color: "bg-red-50 text-red-700 border-red-200", icon: Wrench },
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("info");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchAnnouncements(); }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function create() {
    if (!title.trim() || !content.trim()) { toast.error("Nhập tiêu đề và nội dung"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type }),
      });
      if (res.ok) {
        toast.success("Đã tạo announcement!");
        setShowCreate(false); setTitle(""); setContent(""); setType("info");
        fetchAnnouncements();
      }
    } catch { toast.error("Lỗi"); }
    setCreating(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("Xóa announcement?")) return;
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    fetchAnnouncements();
    toast.success("Đã xóa");
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-slate-500 mt-1 text-sm">Quản lý thông báo system-wide</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Tạo Mới
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Announcement Mới</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tiêu đề</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Maintenance scheduled..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Loại</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                <option value="info">ℹ️ Info</option>
                <option value="warning">⚠️ Warning</option>
                <option value="maintenance">🔧 Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nội dung</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Nội dung thông báo..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none" />
          </div>
          <div className="flex gap-2">
            <Button onClick={create} disabled={creating} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl">
              {creating ? "Đang tạo..." : "Đăng Announcement"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Hủy</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có announcement nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const tc = typeConfig[a.type] || typeConfig.info;
            const Icon = tc.icon;
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-4 ${a.isActive ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <h3 className="font-bold text-slate-900">{a.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tc.color}`}>{tc.label}</span>
                      {!a.isActive && <span className="text-[10px] text-slate-400">(disabled)</span>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{a.content}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">{new Date(a.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleActive(a.id, a.isActive)} className="text-slate-400 hover:text-slate-600 p-1">
                      {a.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteAnnouncement(a.id)} className="text-slate-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
