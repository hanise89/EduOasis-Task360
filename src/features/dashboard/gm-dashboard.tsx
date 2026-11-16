"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { PeriodSelector } from "@/components/common/period-selector";
import { KpiCard } from "@/components/common/kpi-card";
import { ScoreRing } from "@/components/common/score-ring";
import { SectionHeader, LoadingCard, EmptyState, StatusBadge, PageContainer } from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials, daysUntil, formatDate, GRADE_META } from "@/lib/meta";
import type { StaffScore, WorkloadInfo } from "@/types";
import {
  Activity, AlertTriangle, ArrowUpRight, BarChart3, CheckCircle2, Clock,
  TrendingUp, TrendingDown, Minus, Users, Zap, Eye, ChevronRight,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend,
} from "recharts";
import { motion } from "framer-motion";

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };

export function GmDashboard() {
  const period = useAppStore((s) => s.period);
  const setView = useAppStore((s) => s.setView);
  const setSelectedStaffId = useAppStore((s) => s.setSelectedStaffId);

  const { data, isLoading } = useQuery({
    queryKey: ["gm-dashboard", period],
    queryFn: () => apiGet<{
      kpis: { active: number; overdue: number; completedThisWeek: number; avgScore: number; totalStaff: number; overloadedStaff: number };
      scores: StaffScore[];
      workloads: WorkloadInfo[];
      attention: {
        overdueTasks: any[]; openBlockers: any[]; upcomingDeadlines: any[]; overloadedStaff: any[];
      };
    }>(`/api/dashboard/gm?period=${period}`),
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div />
          <PeriodSelector />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <LoadingCard key={i} />)}
        </div>
      </PageContainer>
    );
  }

  const kpis = data?.kpis;
  const scores = data?.scores || [];
  const workloads = data?.workloads || [];
  const attention = data?.attention;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap pb-4 border-b border-border">
        <div>
          <div className="eyebrow">Papan Pemuka GM</div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-1">Gambaran Keseluruhan Pasukan</h1>
        </div>
        <PeriodSelector />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard index={1} label="Tugasan Aktif" value={kpis?.active ?? 0} icon={Activity} accent="primary" hint={`${kpis?.overdue ?? 0} tertunggak`} trend="flat" />
        <KpiCard index={2} label="Siap Minggu Ini" value={kpis?.completedThisWeek ?? 0} icon={CheckCircle2} accent="success" hint="tugasan disiapkan" />
        <KpiCard index={3} label="Purata Skor Pasukan" value={kpis?.avgScore ?? 0} icon={BarChart3} accent="accent" hint={`daripada ${kpis?.totalStaff ?? 0} staf`} onClick={() => setView("performance")} />
        <KpiCard index={4} label="Staf Beban Tinggi" value={kpis?.overloadedStaff ?? 0} icon={Zap} accent="warning" hint="memerlukan perhatian" onClick={() => setView("workload")} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Leaderboard */}
        <Card className="xl:col-span-2 p-4 lg:p-5 card-flat rounded-md">
          <SectionHeader
            index={1}
            eyebrow="Prestasi Pasukan"
            title="Kedudukan Prestasi Staf"
            subtitle={`Tempoh: ${scores[0]?.period?.label || "Bulan Ini"}`}
            icon={Users}
            action={
              <button onClick={() => setView("performance")} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                Lihat semua <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          <div className="overflow-x-auto scroll-slim">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="text-left font-medium py-2 pr-2">#</th>
                  <th className="text-left font-medium py-2 pr-2">Staf</th>
                  <th className="text-left font-medium py-2 px-2 hidden sm:table-cell">Jawatan</th>
                  <th className="text-center font-medium py-2 px-2">Skor</th>
                  <th className="text-center font-medium py-2 px-2">Gred</th>
                  <th className="text-center font-medium py-2 px-2 hidden md:table-cell">Trend</th>
                  <th className="py-2 pl-2"></th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, idx) => {
                  const workload = workloads.find((w) => w.userId === s.userId);
                  const TrendIcon = TREND_ICON[s.trend];
                  return (
                    <tr
                      key={s.userId}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group"
                      onClick={() => {
                        setSelectedStaffId(s.userId);
                        setView("performance");
                      }}
                    >
                      <td className="py-3 pr-2">
                        <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-semibold tabular-nums border", idx === 0 ? "bg-status-warning/15 text-status-warning border-status-warning/40" : idx === 1 ? "bg-muted text-foreground border-border" : idx === 2 ? "bg-status-danger/10 text-status-danger border-status-danger/30" : "text-muted-foreground border-transparent")}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback style={{ backgroundColor: workload ? "#0E7C86" : "#1F3A5F" }} className="text-white text-[10px] font-semibold">
                              {initials(s.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[140px]">{s.userName}</div>
                            {workload && <div className="sm:hidden text-[10px] text-muted-foreground">{workload.status}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 hidden sm:table-cell">
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {workload ? (WORKLOAD_LABELS as any)[workload.status] : "—"}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={cn("text-base font-semibold tabular-nums", s.overall >= 75 ? "text-status-success" : s.overall >= 60 ? "text-status-warning" : "text-status-danger")}>
                          {s.overall}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-sm text-xs font-bold border", GRADE_META[s.grade].bg, GRADE_META[s.grade].text, GRADE_META[s.grade].border)}>
                          {s.grade}
                        </span>
                      </td>
                      <td className="py-2 px-2 hidden md:table-cell text-center">
                        <TrendIcon className={cn("w-4 h-4 inline", s.trend === "up" ? "text-status-success" : s.trend === "down" ? "text-status-danger" : "text-muted-foreground")} />
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Radar chart - average team */}
        <Card className="p-4 lg:p-5 card-flat rounded-md">
          <SectionHeader index={2} eyebrow="Profil Pasukan" title="Profil 6 Dimensi" subtitle="Purata pasukan" icon={BarChart3} />
          <TeamRadar scores={scores} />
        </Card>
      </div>

      {/* Workload heatmap + Attention */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <Card className="xl:col-span-2 p-4 lg:p-5 card-flat rounded-md">
          <SectionHeader index={3} eyebrow="Beban Kerja" title="Peta Haba Beban Kerja" subtitle="Status beban staf mengikut minggu" icon={Activity} action={<button onClick={() => setView("workload")} className="text-xs text-accent hover:underline inline-flex items-center gap-1">Butiran <ChevronRight className="w-3 h-3" /></button>} />
          <WorkloadHeatmap workloads={workloads} scores={scores} />
        </Card>

        {/* Attention list */}
        <Card className="p-4 lg:p-5 card-flat rounded-md">
          <SectionHeader index={4} eyebrow="Isu Kritikal" title="Perlu Perhatian" subtitle="Isu yang memerlukan tindakan" icon={AlertTriangle} />
          <AttentionList attention={attention} onGotoTasks={() => setView("tasks")} />
        </Card>
      </div>
    </PageContainer>
  );
}

const WORKLOAD_LABELS: Record<string, string> = {
  Rendah: "Beban rendah", Seimbang: "Seimbang", Tinggi: "Tinggi", "Beban Berlebihan": "Berlebihan",
};

function TeamRadar({ scores }: { scores: StaffScore[] }) {
  if (scores.length === 0) {
    return <EmptyState icon={BarChart3} title="Tiada data" description="Tiada skor untuk dipaparkan." />;
  }
  const dims = ["taskCompletion", "timeliness", "workQuality", "initiative", "communication", "productivity"];
  const labels: Record<string, string> = {
    taskCompletion: "Penyiapan", timeliness: "Ketepatan", workQuality: "Kualiti",
    initiative: "Inisiatif", communication: "Komunikasi", productivity: "Produktiviti",
  };
  const avg = dims.map((d) => {
    const vals = scores.map((s) => s.dimensions.find((x) => x.key === d)?.score || 0);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });
  const top = scores[0];
  const combined = dims.map((d, i) => ({
    dim: labels[d],
    Pasukan: avg[i],
    Top: top.dimensions.find((x) => x.key === d)?.score || 0,
  }));

  return (
    <div className="h-72 px-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={combined} outerRadius="70%" margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} angle={90} />
          <Radar name="Purata Pasukan" dataKey="Pasukan" stroke="#0E7C86" fill="#0E7C86" fillOpacity={0.45} strokeWidth={2} isAnimationActive={false} />
          <Radar name="Staf Teratas" dataKey="Top" stroke="#1F3A5F" fill="#1F3A5F" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="3 3" isAnimationActive={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)", background: "var(--popover)" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WorkloadHeatmap({ workloads, scores }: { workloads: WorkloadInfo[]; scores: StaffScore[] }) {
  if (workloads.length === 0) {
    return <EmptyState icon={Activity} title="Tiada data beban kerja" />;
  }
  const statusColor: Record<string, string> = {
    Rendah: "bg-status-info/30", Seimbang: "bg-status-success/40", Tinggi: "bg-status-warning/50", "Beban Berlebihan": "bg-status-danger/60",
  };
  // Build a 4-week projection
  return (
    <div className="space-y-2">
      {workloads.map((w) => {
        const score = scores.find((s) => s.userId === w.userId);
        return (
          <div key={w.userId} className="flex items-center gap-3">
            <div className="w-32 lg:w-40 shrink-0 min-w-0">
              <div className="text-xs font-medium truncate">{w.userName}</div>
              <div className="text-[10px] text-muted-foreground">{w.activeTasks} tugasan aktif</div>
            </div>
            <div className="flex-1 flex items-center gap-1.5">
              <div className="flex-1 h-6 rounded-sm bg-muted/40 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, w.utilisation)}%` }}
                  transition={{ duration: 0.6 }}
                  className={cn("h-full", statusColor[w.status])}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums w-9 text-right shrink-0 text-muted-foreground">
                {w.utilisation}%
              </span>
              <StatusBadge status={w.status} type="workload" />
            </div>
            {score && (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <ScoreRing score={score.overall} size={36} thickness={4} />
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-2 mt-2 border-t border-border text-[10px] text-muted-foreground">
        <span className="font-medium">Legenda:</span>
        {["Seimbang", "Tinggi", "Beban Berlebihan"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={cn("w-2.5 h-2.5 rounded-sm", statusColor[s])} /> {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function AttentionList({ attention, onGotoTasks }: { attention: any; onGotoTasks: () => void }) {
  if (!attention) return <LoadingCard />;
  const items = [
    ...attention.overdueTasks.slice(0, 3).map((t: any) => ({ type: "overdue", ...t })),
    ...attention.openBlockers.slice(0, 2).map((b: any) => ({ type: "blocker", ...b })),
    ...attention.upcomingDeadlines.slice(0, 3).map((t: any) => ({ type: "deadline", ...t })),
    ...attention.overloadedStaff.slice(0, 2).map((s: any) => ({ type: "overload", ...s })),
  ];
  if (items.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Semuanya dalam keadaan baik" description="Tiada isu yang memerlukan perhatian segera." />;
  }
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto scroll-slim">
      {items.map((item, i) => <AttentionItem key={i} item={item} onClick={onGotoTasks} />)}
    </div>
  );
}

function AttentionItem({ item, onClick }: { item: any; onClick: () => void }) {
  const config = {
    overdue: { icon: Clock, color: "text-status-danger", bar: "bg-status-danger", label: "Tertunggak" },
    blocker: { icon: AlertTriangle, color: "text-status-danger", bar: "bg-status-danger", label: "Halangan" },
    deadline: { icon: Clock, color: "text-status-warning", bar: "bg-status-warning", label: "Hampir Tarikh Akhir" },
    overload: { icon: Zap, color: "text-status-warning", bar: "bg-status-warning", label: "Beban Tinggi" },
  }[item.type as string] || { icon: AlertTriangle, color: "text-muted-foreground", bar: "bg-muted-foreground", label: "Lain" };
  const Icon = config.icon;
  return (
    <button onClick={onClick} className="relative w-full text-left p-2.5 pl-3 rounded-md border border-border hover:bg-muted/40 transition-colors group overflow-hidden">
      {/* Swiss accent: 1px left-edge color bar, full height */}
      <span className={cn("absolute left-0 top-0 bottom-0 w-px", config.bar)} aria-hidden />
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-sm border border-border flex items-center justify-center shrink-0">
          <Icon className={cn("w-3.5 h-3.5", config.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", config.color)}>{config.label}</span>
            {item.priority && <StatusBadge status={item.priority} type="priority" />}
          </div>
          <div className="text-xs font-medium mt-0.5 truncate">
            {item.title || item.description || item.userName}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
            {item.assigneeName && <span>{item.assigneeName}</span>}
            {item.dueDate && <span> · Tarikh akhir: {formatDate(item.dueDate)}</span>}
            {item.utilisation && <span> · {item.utilisation}% utilisasi</span>}
            {item.helpNeeded && <span> · {item.helpNeeded}</span>}
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
      </div>
    </button>
  );
}
