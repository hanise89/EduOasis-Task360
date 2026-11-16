"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { relativeTime, formatDateTime } from "@/lib/meta";

import {
  SectionHeader,
  EmptyState,
  PageContainer,
} from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  Hourglass,
  Star,
  Award,
  RotateCcw,
  UserPlus,
  Loader2,
  ChevronRight,
} from "lucide-react";

import type { Notification } from "@/types";

// ---- Types ----------------------------------------------------------------

type NotifFilter = "all" | "unread" | "read";

type NotifType =
  | "task_assigned"
  | "deadline_soon"
  | "deadline_passed"
  | "task_returned"
  | "comment_new"
  | "blocker_reported"
  | "initiative_submitted"
  | "initiative_verified"
  | "extension_request"
  | "quality_reviewed"
  | "task_review"
  | "accountability_rated";

interface NotifsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ---- Type → Icon + Color meta --------------------------------------------

const NOTIF_META: Record<
  NotifType,
  { icon: React.ComponentType<{ className?: string }>; tone: "info" | "success" | "warning" | "danger" | "neutral" | "accent" }
> = {
  task_assigned: { icon: UserPlus, tone: "accent" },
  deadline_soon: { icon: Clock, tone: "warning" },
  deadline_passed: { icon: Clock, tone: "danger" },
  task_returned: { icon: RotateCcw, tone: "warning" },
  comment_new: { icon: MessageSquare, tone: "info" },
  blocker_reported: { icon: AlertTriangle, tone: "danger" },
  initiative_submitted: { icon: Lightbulb, tone: "info" },
  initiative_verified: { icon: Lightbulb, tone: "success" },
  extension_request: { icon: Hourglass, tone: "warning" },
  quality_reviewed: { icon: Star, tone: "success" },
  task_review: { icon: CheckCircle2, tone: "info" },
  accountability_rated: { icon: Award, tone: "success" },
};

const TONE_ICON: Record<string, string> = {
  info: "text-status-info bg-status-info/10",
  success: "text-status-success bg-status-success/10",
  warning: "text-status-warning bg-status-warning/15",
  danger: "text-status-danger bg-status-danger/10",
  neutral: "text-muted-foreground bg-muted",
  accent: "text-oasis-teal bg-oasis-teal/10",
};

// 2px-wide status-colored vertical bar (sharp, full height)
const TONE_BAR: Record<string, string> = {
  info: "bg-status-info",
  success: "bg-status-success",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  neutral: "bg-muted-foreground/50",
  accent: "bg-accent",
};

// ---- Date grouping --------------------------------------------------------

type DateGroupKey = "today" | "yesterday" | "this_week" | "older";

const GROUP_ORDER: DateGroupKey[] = ["today", "yesterday", "this_week", "older"];

const GROUP_LABEL: Record<DateGroupKey, string> = {
  today: "Hari Ini",
  yesterday: "Semalam",
  this_week: "Minggu Ini",
  older: "Lebih Lama",
};

function groupKey(dateStr: string): DateGroupKey {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  if (d >= startOfWeek) return "this_week";
  return "older";
}

// ---- Navigation helper ----------------------------------------------------

function navigateFromLink(
  link: string,
  setView: (v: any) => void,
  setSelectedTaskId: (id: string | null) => void,
  setSelectedStaffId: (id: string | null) => void
) {
  if (!link) return;
  try {
    const url = new URL(link, "http://x");
    const view = url.searchParams.get("view");
    const taskId = url.searchParams.get("id");
    const staffId = url.searchParams.get("staffId");
    if (view === "tasks") {
      setView("tasks");
      if (taskId) setSelectedTaskId(taskId);
    } else if (view === "initiatives") {
      setView("initiatives");
    } else if (view === "performance") {
      setView("performance");
      if (staffId) setSelectedStaffId(staffId);
    }
  } catch {
    // ignore malformed link
  }
}

// ---- Main view ------------------------------------------------------------

export function NotificationsView() {
  const [filter, setFilter] = useState<NotifFilter>("all");
  const qc = useQueryClient();

  const setView = useAppStore((s) => s.setView);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);
  const setSelectedStaffId = useAppStore((s) => s.setSelectedStaffId);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () => apiGet<NotifsResponse>("/api/notifications"),
    staleTime: 15_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Apply client-side filter (the API returns the full set; tab filters here)
  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  // Group filtered list by date bucket
  const grouped = useMemo(() => {
    const map = new Map<DateGroupKey, Notification[]>();
    for (const n of filtered) {
      const k = groupKey(n.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(n);
      map.set(k, arr);
    }
    return map;
  }, [filtered]);

  // ---- Mutations ---------------------------------------------------------

  const markRead = async (n: Notification) => {
    if (n.read) {
      navigateFromLink(n.link, setView, setSelectedTaskId, setSelectedStaffId);
      return;
    }
    // Optimistic local update via invalidate
    try {
      await apiPatch(`/api/notifications/${n.id}/read`);
      navigateFromLink(n.link, setView, setSelectedTaskId, setSelectedStaffId);
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e: any) {
      toast.error(e?.message || "Gagal menandai notifikasi sebagai dibaca.");
    }
  };

  const markAllRead = async () => {
    try {
      await apiPost("/api/notifications/read-all");
      toast.success("Semua notifikasi telah ditandai dibaca.");
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e: any) {
      toast.error(e?.message || "Gagal menandai semua notifikasi.");
    }
  };

  // ---- Counts for tabs ---------------------------------------------------

  const counts = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const read = total - unread;
    return { all: total, unread, read };
  }, [notifications]);

  // ---- Render ------------------------------------------------------------

  return (
    <PageContainer>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-border">
        <div className="min-w-0">
          <span className="eyebrow">Pusat Notifikasi</span>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-status-danger/15 text-status-danger hover:bg-status-danger/20 border border-status-danger/30 rounded-sm h-6 min-w-6 px-2 tabular-nums num-display">
                {unreadCount} belum dibaca
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kemaskini tugasan, tarikh akhir, dan aktiviti penting pasukan anda.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm" className="gap-2 rounded-sm">
            <CheckCheck className="w-4 h-4" />
            Tanda Semua Dibaca
          </Button>
        )}
      </div>

      {/* Filter tabs — sharp segmented control */}
      <div className="inline-flex items-center gap-0.5 p-0.5 rounded-sm border border-border bg-muted/30 overflow-x-auto max-w-full">
        {([
          { key: "all", label: "Semua", count: counts.all, countClass: "text-muted-foreground" },
          { key: "unread", label: "Belum Dibaca", count: counts.unread, countClass: counts.unread > 0 ? "text-status-danger font-medium" : "text-muted-foreground" },
          { key: "read", label: "Dibaca", count: counts.read, countClass: "text-muted-foreground" },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as NotifFilter)}
            className={cn(
              "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5",
              filter === f.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn(
                "text-[10px] tabular-nums",
                filter === f.key ? "text-background/70" : f.countClass
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <NotifSkeletons />
      ) : filtered.length === 0 ? (
        <Card className="p-0 overflow-hidden border-border card-flat rounded-md">
          <EmptyState
            icon={filter === "read" ? BellOff : Bell}
            title={
              filter === "unread"
                ? "Tiada notifikasi belum dibaca"
                : filter === "read"
                ? "Belum ada notifikasi yang dibaca"
                : "Tiada notifikasi buat masa ini"
            }
            description={
              filter === "unread"
                ? "Anda telah mengemaskini semua. Notifikasi baru akan muncul di sini."
                : "Notifikasi berkaitan tugasan dan aktiviti akan dipaparkan di sini."
            }
          />
        </Card>
      ) : (
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto scroll-slim pr-1 -mr-1 space-y-5">
          <AnimatePresence mode="popLayout">
            {GROUP_ORDER.map((gk, gIdx) => {
              const items = grouped.get(gk);
              if (!items || items.length === 0) return null;
              return (
                <motion.div
                  key={gk}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-0"
                >
                  <SectionHeader
                    title={GROUP_LABEL[gk]}
                    eyebrow="Kumpulan"
                    index={String(gIdx + 1).padStart(2, "0")}
                    subtitle={`${items.length} notifikasi`}
                  />
                  <Card className="p-0 overflow-hidden card-flat rounded-md">
                    <div>
                      {items.map((n, idx) => (
                        <NotifRow
                          key={n.id}
                          n={n}
                          isLast={idx === items.length - 1}
                          onOpen={() => markRead(n)}
                        />
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageContainer>
  );
}

// ---- Row component --------------------------------------------------------

function NotifRow({ n, isLast, onOpen }: { n: Notification; isLast: boolean; onOpen: () => void }) {
  const meta = NOTIF_META[n.type as NotifType] ?? {
    icon: Bell,
    tone: "neutral" as const,
  };
  const Icon = meta.icon;
  const barClass = TONE_BAR[meta.tone];
  const unread = !n.read;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${unread ? "Belum dibaca: " : ""}${n.title}`}
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group",
        "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !isLast && "border-b border-border/50",
        unread ? "bg-accent/[0.04]" : "bg-card opacity-80 hover:opacity-100"
      )}
    >
      {/* 2px-wide status-colored vertical bar (sharp, full height) */}
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 bottom-0 w-0.5", barClass)}
      />

      {/* Middle: title + message + timestamp */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span
            className={cn(
              "text-sm leading-snug truncate flex-1 min-w-0",
              unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
            )}
          >
            {n.title}
          </span>
        </div>
        <p
          className={cn(
            "mt-1 text-[13px] leading-relaxed line-clamp-2",
            unread ? "text-muted-foreground" : "text-muted-foreground/80"
          )}
        >
          {n.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[11px] text-muted-foreground tabular-nums"
            title={formatDateTime(n.createdAt)}
          >
            {relativeTime(n.createdAt)}
          </span>
          {unread && (
            <span className="eyebrow text-accent">Baharu</span>
          )}
        </div>
      </div>

      {/* Right: read/unread indicator */}
      <div className="shrink-0 mt-1">
        {unread ? (
          <span
            aria-label="Belum dibaca"
            className="block w-1.5 h-1.5 rounded-sm bg-primary"
          />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground" />
        )}
      </div>
    </div>
  );
}

// ---- Loading skeleton -----------------------------------------------------

function NotifSkeletons() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Card className="p-0 overflow-hidden card-flat rounded-md">
            {[0, 1].map((i) => (
              <div key={i} className="p-4 flex items-start gap-3 border-b border-border/50 last:border-0">
                <Skeleton className="w-3.5 h-3.5 rounded-sm shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}
