"use client";

import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, Moon, Sun, Menu, ChevronDown, Settings as SettingsIcon, User as UserIcon, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { initials, relativeTime } from "@/lib/meta";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { Notification, User } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Papan Pemuka",
  tasks: "Tugasan",
  performance: "Prestasi",
  workload: "Beban Kerja",
  initiatives: "Inisiatif",
  reports: "Laporan",
  notifications: "Notifikasi",
  settings: "Tetapan",
  profile: "Profil",
};

export function Topbar() {
  const user = useAppStore((s) => s.user)!;
  const view = useAppStore((s) => s.view);
  const logout = useAppStore((s) => s.logout);
  const setView = useAppStore((s) => s.setView);
  const setNotifOpen = useAppStore((s) => s.setNotifOpen);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const { data, refetch } = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: () => apiGet<{ notifications: Notification[]; unreadCount: number }>("/api/notifications"),
    refetchInterval: 30000,
  });
  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  async function handleLogout() {
    try {
      await apiPost("/api/auth/logout", {});
      logout();
      toast.success("Anda telah log keluar.");
    } catch {
      logout();
    }
  }

  async function markAllRead() {
    await apiPost("/api/notifications/read-all", {});
    refetch();
  }

  async function markRead(id: string) {
    await apiPatch(`/api/notifications/${id}/read`, {});
    refetch();
  }

  async function apiPatch(path: string, body?: any) {
    const res = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, credentials: "include" });
    return res.json();
  }

  function gotoNotif(link: string) {
    if (link.includes("view=tasks")) {
      const id = new URLSearchParams(link.split("?")[1]).get("id");
      setView("tasks");
      if (id) useAppStore.getState().setSelectedTaskId(id);
    } else if (link.includes("view=initiatives")) setView("initiatives");
    else if (link.includes("view=performance")) setView("performance");
    else setView("dashboard");
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 sm:px-6 lg:px-8 gap-3">
      {/* mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden rounded-sm">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <MobileNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0">
        <div className="eyebrow mb-0.5">Bahagian</div>
        <h1 className="text-base lg:text-lg font-semibold tracking-tight truncate">
          {VIEW_TITLES[view] || "Papan Pemuka"}
        </h1>
      </div>

      {/* notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-sm" aria-label="Notifikasi">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-status-danger text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 sm:w-96 p-0 rounded-sm" align="end">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="font-semibold text-sm">Notifikasi</div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                Tanda Semua Dibaca
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto scroll-slim">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                Tiada notifikasi.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                    gotoNotif(n.link);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${!n.read ? "bg-accent/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{relativeTime(n.createdAt)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Tukar tema"
        className="rounded-sm"
      >
        {mounted ? (
          theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>

      {/* user menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted transition-colors">
            <Avatar className="w-8 h-8 rounded-sm">
              <AvatarFallback style={{ backgroundColor: user.avatarColor }} className="text-white text-xs font-semibold rounded-sm">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-sm font-medium truncate max-w-[140px]">{user.name}</div>
              <div className="eyebrow">
                {user.role === "GM" ? "General Manager" : "Staf"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-sm">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setView("profile")}>
            <UserIcon className="w-4 h-4 mr-2" /> Profil Saya
          </DropdownMenuItem>
          {user.role === "GM" && (
            <DropdownMenuItem onClick={() => setView("settings")}>
              <SettingsIcon className="w-4 h-4 mr-2" /> Tetapan Sistem
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-status-danger focus:text-status-danger">
            <LogOut className="w-4 h-4 mr-2" /> Log Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
