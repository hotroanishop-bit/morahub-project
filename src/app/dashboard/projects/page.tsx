"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Folder, Plus, Settings, Trash2, Key, Users, MoreVertical, Edit2, ExternalLink } from "lucide-react";

interface Project { id: string; name: string; description: string | null; isActive: boolean; _count: { apiKeys: number }; createdAt: string }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  }

  async function createProject() {
    if (!name.trim()) { toast.error("Nhập tên project"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
      });
      if (res.ok) {
        toast.success("Tạo project thành công!");
        setShowCreate(false); setName(""); setDesc("");
        fetchProjects();
      } else {
        const d = await res.json();
        toast.error(d.error || "Lỗi");
      }
    } catch { toast.error("Lỗi kết nối"); }
    setCreating(false);
  }

  async function deleteProject(id: string) {
    if (!confirm("Xóa project này? API keys trong project sẽ bị xóa.")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Đã xóa!"); fetchProjects(); }
      else toast.error("Lỗi xóa");
    } catch { toast.error("Lỗi"); }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">Dự Án</h1>
          <p className="text-slate-500 mt-1 text-sm">Quản lý API key theo từng dự án</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Tạo Dự Án
        </Button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 text-lg mb-4">Tạo Dự Án Mới</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-700 text-sm font-medium">Tên dự án *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: My App" className="bg-slate-50 border-slate-200 text-slate-900 mt-1 rounded-xl h-11" />
              </div>
              <div>
                <Label className="text-slate-700 text-sm font-medium">Mô tả</Label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả ngắn..." rows={3} className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Hủy</Button>
              <Button onClick={createProject} disabled={creating} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">
                {creating ? "Đang tạo..." : "Tạo"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Đang tải...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1 font-medium">Chưa có dự án</p>
          <p className="text-slate-400 text-sm mb-4">Tạo dự án để tổ chức API key theo từng ứng dụng</p>
          <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Tạo Dự Án Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div className="flex gap-1">
                  <a href={`/dashboard/keys?project=${p.id}`} className="text-slate-400 hover:text-indigo-500 p-1"><Key className="w-4 h-4" /></a>
                  <button onClick={() => deleteProject(p.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900">{p.name}</h3>
              {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
              <div className="flex items-center justify-between mt-4">
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">{p._count.apiKeys} keys</Badge>
                <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
