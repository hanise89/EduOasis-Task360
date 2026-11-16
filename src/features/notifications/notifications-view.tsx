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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="hidden sm:flex w-11 h-11 rounded-xl bg-oasis-teal/10 items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-oasis-teal" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Pusat Notifikasi
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">
                Notifikasi
              </h1>
              {unreadCount > 0 && (
                <Badge className="bg-status-danger/15 text-status-danger hover:bg-status-danger/20 border-0 rounded-full h-6 min-w-6 px-2 tabular-nums">
                  {unreadCount} belum dibaca
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kemaskini tugasan, tarikh akhir, dan aktiviti penting pasukan anda.
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm" className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Tanda Semua Dibaca
          </Button>
        )}
      </div>

      {/* Tabs + list */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as NotifFilter)}>
        <TabsList className="bg-muted/60 p-1 h-auto">
          <TabsTrigger value="all" className="gap-1.5">
            Semua
            {counts.all > 0 && (
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {counts.all}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Belum Dibaca
            {counts.unread > 0 && (
              <span className="text-[10px] tabular-nums text-status-danger font-medium">
                {counts.unread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="gap-1.5">
            Dibaca
            {counts.read > 0 && (
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {counts.read}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 focus-visible:outline-none">
          {isLoading ? (
            <NotifSkeletons />
          ) : filtered.length === 0 ? (
            <Card className="p-0 overflow-hidden border-border">
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
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto scroll-slim pr-1 -mr-1 space-y-5">
              <AnimatePresence mode="popLayout">
                {GROUP_ORDER.map((gk) => {
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
                      className="space-y-2"
                    >
                      <SectionHeader
                        title={GROUP_LABEL[gk]}
                        subtitle={`${items.length} notifikasi`}
                      />
                      <div className="space-y-2">
                        {items.map((n) => (
                          <NotifRow
                            key={n.id}
                            n={n}
                            onOpen={() => markRead(n)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// ---- Row component --------------------------------------------------------

function NotifRow({ n, onOpen }: { n: Notification; onOpen: () => void }) {
  const meta = NOTIF_META[n.type as NotifType] ?? {
    icon: Bell,
    tone: "neutral" as const,
  };
  const Icon = meta.icon;
  const toneClass = TONE_ICON[meta.tone];
  const unread = !n.read;

  return (
    <Card
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
        "relative p-4 cursor-pointer border-border transition-colors group overflow-hidden",
        "hover:border-accent/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        unread
          ? "bg-accent/[0.04] border-accent/20"
          : "bg-card opacity-80 hover:opacity-100"
      )}
    >
      {/* Accent left border for unread */}
      {unread && (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1 bg-oasis-teal"
        />
      )}

      <div className="flex items-start gap-3 min-w-0">
        {/* Icon */}
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            toneClass
          )}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-sm leading-snug truncate",
                    unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                  )}
                >
                  {n.title}
                </span>
                {unread && (
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full bg-oasis-teal shrink-0 animate-pulse"
                  />
                )}
              </div>
              <p
                className={cn(
                  "mt-0.5 text-[13px] leading-relaxed line-clamp-2",
                  unread ? "text-muted-foreground" : "text-muted-foreground/80"
                )}
              >
                {n.message}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 mt-0.5" />
          </div>

          {/* Footer meta */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[11px] text-muted-foreground tabular-nums"
              title={formatDateTime(n.createdAt)}
            >
              {relativeTime(n.createdAt)}
            </span>
            {unread && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-oasis-teal">
                Baharu
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---- Loading skeleton -----------------------------------------------------

function NotifSkeletons() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <Card key={i} className="p-4 flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
