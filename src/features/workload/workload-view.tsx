"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  SectionHeader,
  LoadingCard,
  EmptyState,
  PageContainer,
  StatusBadge,
} from "@/components/common/ui";
import { KpiCard } from "@/components/common/kpi-card";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/meta";
import { motion } from "framer-motion";
import type { WorkloadInfo, WorkloadStatus } from "@/types";
import {
  Users,
  AlertTriangle,
  Gauge,
  CheckCircle2,
  Activity,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

// ---------- Types ----------
interface HeatmapWeek {
  label: string;
  offset: number;
}
interface HeatmapCell {
  utilisation: number;
  status: WorkloadStatus;
  label: string;
}
interface HeatmapStaff {
  staff: {
    id: string;
    name: string;
    position: string;
    avatarColor: string;
  };
  cells: HeatmapCell[];
}
interface HeatmapPayload {
  weeks: HeatmapWeek[];
  matrix: HeatmapStaff[];
}

// ---------- Constants ----------
const WEEK_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Minggu Ini" },
  { value: 1, label: "Minggu Hadapan" },
  { value: 2, label: "Minggu +2" },
];

// Status colour mapping (workload bands per PRD)
const STATUS_BAR_COLOR: Record<WorkloadStatus, string> = {
  Rendah: "bg-status-info",
  Seimbang: "bg-status-success",
  Tinggi: "bg-status-warning",
  "Beban Berlebihan": "bg-status-danger",
};

const STATUS_CELL_BG: Record<WorkloadStatus, string> = {
  Rendah: "bg-status-info/30",
  Seimbang: "bg-status-success/40",
  Tinggi: "bg-status-warning/55",
  "Beban Berlebihan": "bg-status-danger/65",
};

const STATUS_CELL_TEXT: Record<WorkloadStatus, string> = {
  Rendah: "text-status-info",
  Seimbang: "text-status-success",
  Tinggi: "text-status-warning",
  "Beban Berlebihan": "text-status-danger",
};

const RECOMMENDATIONS: Record<
  WorkloadStatus,
  { action: string; tone: "danger" | "warning"; hint: string }
> = {
  "Beban Berlebihan": {
    action: "Agih semula tugasan; amaran kepada GM",
    tone: "danger",
    hint: ">110% utilisasi",
  },
  Tinggi: {
    action: "Pantau; elak tambah tugasan baharu",
    tone: "warning",
    hint: "91–110% utilisasi",
  },
  Seimbang: {
    action: "Kekalkan",
    tone: "warning",
    hint: "60–90% utilisasi",
  },
  Rendah: {
    action: "Pertimbang menambah tugasan",
    tone: "warning",
    hint: "<60% utilisasi",
  },
};

const WEEK_LABEL: Record<number, string> = {
  0: "Minggu Ini",
  1: "Minggu Hadapan",
  2: "Minggu +2",
};

// ---------- Main View ----------
export function WorkloadView() {
  const [weeksAhead, setWeeksAhead] = useState<number>(0);

  const { data: wlData, isLoading: wlLoading } = useQuery({
    queryKey: ["workload", weeksAhead],
    queryFn: () =>
      apiGet<{ workloads: WorkloadInfo[] }>(
        `/api/workload?weeksAhead=${weeksAhead}`
      ),
  });

  const { data: heatData, isLoading: heatLoading } = useQuery({
    queryKey: ["workload-heatmap"],
    queryFn: () => apiGet<{ heatmap: HeatmapPayload }>("/api/workload/heatmap"),
  });

  const workloads = wlData?.workloads || [];
  const heatmap = heatData?.heatmap;

  // KPI aggregation
  const totalStaff = workloads.length;
  const overloadedCount = workloads.filter(
    (w) => w.status === "Beban Berlebihan"
  ).length;
  const highCount = workloads.filter((w) => w.status === "Tinggi").length;
  const balancedCount = workloads.filter(
    (w) => w.status === "Seimbang"
  ).length;

  // Sorted list: most loaded first
  const sortedWorkloads = [...workloads].sort((a, b) => {
    const order: Record<WorkloadStatus, number> = {
      "Beban Berlebihan": 0,
      Tinggi: 1,
      Seimbang: 2,
      Rendah: 3,
    };
    if (order[a.status] !== order[b.status])
      return order[a.status] - order[b.status];
    return b.utilisation - a.utilisation;
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap border-b border-border pb-4">
        <div>
          <span className="eyebrow">BEBAN KERJA STAF</span>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-1">
            Pemantauan Beban Kerja
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau utilisasi jam tugasan aktif vs kapasiti mingguan setiap staf
          </p>
        </div>
        <WeekSegmentedControl value={weeksAhead} onChange={setWeeksAhead} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          label="Total Staf"
          value={totalStaff}
          icon={Users}
          accent="primary"
          hint="staf aktif dipantau"
          index={1}
        />
        <KpiCard
          label="Staf Beban Berlebihan"
          value={overloadedCount}
          icon={AlertTriangle}
          accent="danger"
          hint=">110% utilisasi"
          index={2}
        />
        <KpiCard
          label="Staf Beban Tinggi"
          value={highCount}
          icon={Gauge}
          accent="warning"
          hint="91–110% utilisasi"
          index={3}
        />
        <KpiCard
          label="Staf Seimbang"
          value={balancedCount}
          icon={CheckCircle2}
          accent="success"
          hint="60–90% utilisasi"
          index={4}
        />
      </div>

      {/* Workload list */}
      <Card className="p-4 lg:p-5 card-flat rounded-md">
        <SectionHeader
          title="Senarai Beban Kerja Staf"
          subtitle={`Tempoh: ${WEEK_LABEL[weeksAhead]}`}
          icon={Activity}
          index={1}
          eyebrow="Kapasiti"
        />
        {wlLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-md border border-border"
              >
                <Skeleton className="w-9 h-9 rounded-sm" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : sortedWorkloads.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Tiada data beban kerja"
            description="Tiada staf aktif dijumpai untuk tempoh ini."
          />
        ) : (
          <div className="space-y-2.5 max-h-[34rem] overflow-y-auto scroll-slim pr-1">
            {sortedWorkloads.map((w, idx) => (
              <WorkloadRow key={w.userId} w={w} index={idx + 1} />
            ))}
          </div>
        )}
      </Card>

      {/* Heatmap */}
      <Card className="p-4 lg:p-5 card-flat rounded-md">
        <SectionHeader
          title="Peta Haba Beban Kerja"
          subtitle="4 minggu lepas + 2 minggu akan datang"
          icon={Activity}
          index={2}
          eyebrow="Peta Haba"
        />
        {heatLoading ? (
          <LoadingCard />
        ) : !heatmap || heatmap.matrix.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Tiada data peta haba"
            description="Data peta haba beban kerja belum tersedia."
          />
        ) : (
          <HeatmapMatrix heatmap={heatmap} />
        )}
      </Card>

      {/* Alerts & Recommendations */}
      <Card className="p-4 lg:p-5 card-flat rounded-md">
        <SectionHeader
          title="Amaran & Cadangan"
          subtitle="Staf dengan beban tinggi / berlebihan memerlukan tindakan"
          icon={Lightbulb}
          index={3}
          eyebrow="Amaran"
        />
        {wlLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : sortedWorkloads.filter(
            (w) => w.status === "Beban Berlebihan" || w.status === "Tinggi"
          ).length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Tiada amaran"
            description="Semua staf berada dalam julat beban kerja yang terkawal."
          />
        ) : (
          <AlertsList workloads={sortedWorkloads} />
        )}
      </Card>
    </PageContainer>
  );
}

// ---------- Week segmented control (Swiss sharp hairline segments) ----------
function WeekSegmentedControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-stretch rounded-sm border border-border overflow-hidden bg-card">
      {WEEK_OPTIONS.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium transition-colors tabular-nums",
            i > 0 && "border-l border-border",
            value === opt.value
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Workload row (staff capacity card) ----------
function WorkloadRow({ w, index }: { w: WorkloadInfo; index: number }) {
  const barColor = STATUS_BAR_COLOR[w.status];
  const widthPct = Math.min(100, Math.max(0, w.utilisation));
  return (
    <div className="p-3 rounded-md border border-border card-flat hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className="index-numeral text-[11px] leading-none select-none mt-1 hidden sm:inline">
          {String(index).padStart(2, "0")}
        </span>
        <Avatar className="w-9 h-9 shrink-0 rounded-sm">
          <AvatarFallback
            className="text-white text-[10px] font-semibold rounded-sm"
            style={{ backgroundColor: "#1F3A5F" }}
          >
            {initials(w.userName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Name + status badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{w.userName}</div>
              <div className="text-[11px] text-muted-foreground truncate tabular-nums">
                {w.activeTasks} tugasan aktif
              </div>
            </div>
            <StatusBadge status={w.status} type="workload" />
          </div>

          {/* Large utilisation % + hours summary */}
          <div className="flex items-baseline justify-between gap-2 mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums num-display leading-none">
                {w.utilisation}%
              </span>
              <span className="text-[10px] text-muted-foreground">utilisasi</span>
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {w.activeTaskHours}h / {w.availableHoursWeek}h
            </span>
          </div>

          {/* Sharp horizontal bar with 100% reference line */}
          <div className="mt-2 relative h-1.5 rounded-none bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${widthPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn("h-full rounded-none", barColor)}
            />
            {/* 100% reference line */}
            <div className="absolute inset-y-0 left-[100%] w-px bg-border-strong -translate-x-px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Heatmap matrix ----------
function HeatmapMatrix({ heatmap }: { heatmap: HeatmapPayload }) {
  const { weeks, matrix } = heatmap;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto scroll-slim -mx-1 px-1">
        <div className="min-w-[36rem]">
          {/* Header row: empty corner + week labels */}
          <div className="flex items-stretch gap-px mb-1.5">
            <div className="w-28 lg:w-36 shrink-0" />
            {weeks.map((wk, i) => {
              const isCurrent = wk.offset === 0;
              const isFuture = wk.offset > 0;
              return (
                <div
                  key={i}
                  className="flex-1 min-w-0 text-center"
                  title={`Minggu ${wk.offset === 0 ? "ini" : wk.offset > 0 ? "+" + wk.offset : wk.offset}`}
                >
                  <div
                    className={cn(
                      "text-[10px] font-medium leading-tight eyebrow",
                      isCurrent
                        ? "text-accent"
                        : isFuture
                          ? "text-muted-foreground"
                          : "text-muted-foreground/70"
                    )}
                  >
                    {wk.label}
                  </div>
                  {isCurrent && (
                    <div className="text-[9px] text-accent uppercase tracking-wide">
                      Kini
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rows — gap-px + bg-border/40 produces hairlines between cells */}
          <div className="bg-border/40 space-y-px">
            {matrix.map((row) => (
              <div key={row.staff.id} className="flex items-stretch gap-px">
                <div className="w-28 lg:w-36 shrink-0 min-w-0 pr-2 flex items-center bg-card">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">
                      {row.staff.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {row.staff.position}
                    </div>
                  </div>
                </div>
                {row.cells.map((cell, i) => (
                  <HeatmapCellBox key={i} cell={cell} week={weeks[i]} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend — sharp squares with hairline borders */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 mt-2 border-t border-border text-[10px] text-muted-foreground">
        <span className="eyebrow">Legenda</span>
        {(Object.keys(STATUS_CELL_BG) as WorkloadStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-sm border border-border",
                STATUS_CELL_BG[s]
              )}
            />
            <span>{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function HeatmapCellBox({
  cell,
  week,
}: {
  cell: HeatmapCell;
  week?: HeatmapWeek;
}) {
  const isCurrent = week?.offset === 0;
  return (
    <div
      className={cn(
        "flex-1 min-w-0 h-9 rounded-none flex items-center justify-center text-[10px] font-semibold tabular-nums",
        STATUS_CELL_BG[cell.status],
        STATUS_CELL_TEXT[cell.status],
        isCurrent && "ring-1 ring-inset ring-accent"
      )}
      title={`${week?.label || ""} · ${cell.status} · ${cell.utilisation}%`}
    >
      {Math.round(cell.utilisation)}%
    </div>
  );
}

// ---------- Alerts & Recommendations ----------
function AlertsList({ workloads }: { workloads: WorkloadInfo[] }) {
  const flagged = workloads.filter(
    (w) => w.status === "Beban Berlebihan" || w.status === "Tinggi"
  );

  return (
    <div className="space-y-2">
      {flagged.map((w) => {
        const rec = RECOMMENDATIONS[w.status];
        const isDanger = rec.tone === "danger";
        const Icon = isDanger ? AlertTriangle : Gauge;
        return (
          <div
            key={w.userId}
            className={cn(
              "flex items-start gap-3 p-3 rounded-md border card-flat",
              isDanger
                ? "border-status-danger/30 bg-status-danger/5"
                : "border-status-warning/30 bg-status-warning/5"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border",
                isDanger
                  ? "bg-status-danger/10 text-status-danger border-status-danger/30"
                  : "bg-status-warning/10 text-status-warning border-status-warning/30"
              )}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{w.userName}</span>
                <StatusBadge status={w.status} type="workload" />
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    isDanger
                      ? "text-status-danger"
                      : "text-status-warning"
                  )}
                >
                  {w.utilisation}% utilisasi
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {w.activeTaskHours}h tugasan aktif / {w.availableHoursWeek}h kapasiti ·{" "}
                {w.activeTasks} tugasan · {rec.hint}
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 mt-1.5 text-xs font-medium",
                  isDanger ? "text-status-danger" : "text-status-warning"
                )}
              >
                <ArrowRight className="w-3 h-3 shrink-0" />
                <span>{rec.action}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
