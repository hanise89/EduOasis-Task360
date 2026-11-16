"use client";

import { useAppStore, type ViewKey } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KanbanSquare,
  Gauge,
  Activity,
  Lightbulb,
  FileText,
  Bell,
  Settings,
  User,
  Layers,
} from "lucide-react";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gmOnly?: boolean;
}

const NAV: NavItem[] = [
  { key: "dashboard", label: "Papan Pemuka", icon: LayoutDashboard },
  { key: "tasks", label: "Tugasan", icon: KanbanSquare },
  { key: "performance", label: "Prestasi", icon: Gauge },
  { key: "workload", label: "Beban Kerja", icon: Activity, gmOnly: true },
  { key: "initiatives", label: "Inisiatif", icon: Lightbulb },
  { key: "reports", label: "Laporan", icon: FileText },
  { key: "notifications", label: "Notifikasi", icon: Bell },
  { key: "settings", label: "Tetapan", icon: Settings, gmOnly: true },
  { key: "profile", label: "Profil", icon: User },
];

export function Sidebar() {
  const user = useAppStore((s) => s.user)!;
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);

  const items = NAV.filter((n) => !n.gmOnly || user.role === "GM");

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar sticky top-0 h-screen">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-sm bg-primary flex items-center justify-center">
          <Layers className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="eyebrow">EDUOASIS</div>
          <div className="text-sm font-semibold tracking-tight">TASK360</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scroll-slim">
        <div className="px-3 mb-2 eyebrow flex items-center gap-2">
          <span className="tabular-nums">01</span>
          <span>Menu Utama</span>
        </div>
        {items.map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key);
                if (item.key !== "tasks") setSelectedTaskId(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors group border-l-2 border-transparent",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto w-1 h-4 bg-primary" />}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 rounded-sm border border-border bg-muted/30 text-[10px] text-muted-foreground leading-relaxed">
          <div className="font-medium text-foreground mb-0.5">Peringatan</div>
          Data demo akan dikekalkan antara muat semula. Gunakan <span className="font-medium">Tetapan → Set Semula</span> untuk memulihkan data asal.
        </div>
      </div>
    </aside>
  );
}
