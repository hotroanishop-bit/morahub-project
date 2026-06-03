"use client";

import { useState, useEffect } from "react";
import { X, Info, AlertTriangle, Wrench } from "lucide-react";

interface Announcement { id: string; title: string; content: string; type: string }

const typeStyles: Record<string, { bg: string; border: string; icon: any }> = {
  info: { bg: "bg-blue-50 border-blue-200", border: "border-blue-200", icon: Info },
  warning: { bg: "bg-amber-50 border-amber-200", border: "border-amber-200", icon: AlertTriangle },
  maintenance: { bg: "bg-red-50 border-red-200", border: "border-red-200", icon: Wrench },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/announcements")
      .then(r => r.json())
      .then(d => setAnnouncements(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map(a => {
        const style = typeStyles[a.type] || typeStyles.info;
        const Icon = style.icon;
        return (
          <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${style.bg}`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-800">{a.title}</span>
              <p className="text-xs text-slate-600 mt-0.5">{a.content}</p>
            </div>
            <button onClick={() => setDismissed(prev => new Set([...prev, a.id]))} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
