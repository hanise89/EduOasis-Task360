"use client";

import { useAppStore, type ViewKey } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KanbanSquare,
  Gauge,
  Lightbulb,
  FileText,
  Bell,
  Settings,
  User,
  Activity,
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
  { key: "workload", label: "Beban", icon: Activity, gmOnly: true },
  { key: "initiatives", label: "Inisiatif", icon: Lightbulb },
  { key: "reports", label: "Laporan", icon: FileText },
  { key: "notifications", label: "Notifikasi", icon: Bell },
  { key: "settings", label: "Tetapan", icon: Settings, gmOnly: true },
  { key: "profile", label: "Profil", icon: User },
];

export function MobileNav({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAppStore((s) => s.user)!;
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const items = NAV.filter((n) => !n.gmOnly || user.role === "GM");

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-5 gap-0.5 px-1 py-1 safe-bottom">
        {items.slice(0, 5).map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key);
                onNavigate?.();
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[9px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
