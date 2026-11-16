"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { PeriodSelector } from "@/components/common/period-selector";
import { KpiCard } from "@/components/common/kpi-card";
import { ScoreRing } from "@/components/common/score-ring";
import { SectionHeader, LoadingCard, EmptyState, StatusBadge, PageContainer } from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, relativeTime, GRADE_META, TASK_STATUS_META, PRIORITY_META } from "@/lib/meta";
import type { StaffScore, WorkloadInfo } from "@/types";
import {
  Activity, CheckCircle2, Clock, AlertTriangle, MessageSquare, Lightbulb,
  TrendingUp, ChevronRight, Target, ListTodo, Send, Zap,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import { motion } from "framer-motion";

export function StaffDashboard() {
  const user = useAppStore((s) => s.user)!;
  const period = useAppStore((s) => s.period);
  const setView = useAppStore((s) => s.setView);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-dashboard", user.id, period],
    queryFn: () => apiGet<{
      kpis: { today: number; overdue: number; inProgress: number; pendingReview: number; overallScore: number; grade: string; workloadStatus: string };
      todayTasks: any[]; overdueTasks: any[];
      score: StaffScore; workload: WorkloadInfo;
      initiatives: any[]; recentFeedback: any[];
    }>(`/api/dashboard/staff?period=${period}`),
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <LoadingCard key={i} />)}
        </div>
      </PageContainer>
    );
  }

  const k = data?.kpis;
  const score = data?.score;
  const workload = data?.workload;

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Papan Pemuka Staf</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-0.5">Selamat datang, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user.position}</p>
        </div>
        <PeriodSelector />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Tugasan Hari Ini" value={k?.today ?? 0} icon={Target} accent="primary" hint="perlu siap hari ini" />
        <KpiCard label="Tertunggak" value={k?.overdue ?? 0} icon={Clock} accent={k?.overdue ? "danger" : "neutral"} hint="tugasan lewat" onClick={() => setView("tasks")} />
        <KpiCard label="Dalam Proses" value={k?.inProgress ?? 0} icon={Activity} accent="accent" hint={`${k?.pendingReview ?? 0} menunggu semakan`} onClick={() => setView("tasks")} />
        <KpiCard label="Skor Prestasi" value={k?.overallScore ?? 0} icon={TrendingUp} accent={gradeAccent(k?.grade || "C")} hint={`Gred ${k?.grade}`} onClick={() => setView("performance")} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Score panel */}
        <Card className="p-4 lg:p-5">
          <SectionHeader title="Skor Prestasi Saya" subtitle={`Tempoh: ${score?.period?.label || "Bulan Ini"}`} icon={TrendingUp} />
          {score && (
            <div className="flex flex-col items-center text-center">
              <ScoreRing score={score.overall} grade={score.grade} showGrade size={120} thickness={10} />
              <div className={cn("mt-3 px-3 py-1 rounded-full text-xs font-medium", GRADE_META[score.grade].bg, GRADE_META[score.grade].text)}>
                {score.grade} — {score.gradeLabel}
              </div>
              <p className="text-xs text-muted-foreground mt-2 max-w-[240px]">
                {score.trend === "up" && "Prestasi anda meningkat berbanding tempoh lepas. Teruskan usaha!"}
                {score.trend === "down" && "Prestasi menurun sedikit. Semak dimensi yang perlu penambahbaikan."}
                {score.trend === "flat" && "Prestasi anda stabil. Teruskan usaha yang konsisten."}
              </p>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {score?.dimensions.map((d) => (
              <div key={d.key} className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground w-28 truncate">{d.name}</div>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn("h-full rounded-full", d.score >= 75 ? "bg-status-success" : d.score >= 60 ? "bg-status-warning" : "bg-status-danger")}
                  />
                </div>
                <div className="text-xs font-semibold tabular-nums w-7 text-right">{d.score}</div>
                <div className="text-[9px] text-muted-foreground w-7 text-right">{d.weight}%</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Today tasks + overdue */}
        <Card className="xl:col-span-2 p-4 lg:p-5">
          <SectionHeader
            title="Tugasan Hari Ini & Tertunggak"
            icon={ListTodo}
            action={<Button size="sm" variant="ghost" onClick={() => setView("tasks")} className="h-7 text-xs">Lihat semua <ChevronRight className="w-3 h-3" /></Button>}
          />
          <div className="space-y-2 max-h-96 overflow-y-auto scroll-slim">
            {data?.todayTasks.length === 0 && data?.overdueTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Tiada tugasan tertunggak" description="Semua tugasan kini terkawal." />
            ) : (
              <>
                {data?.overdueTasks.map((t) => (
                  <button key={t.id} onClick={() => { setSelectedTaskId(t.id); setView("tasks"); }} className="w-full text-left p-3 rounded-md border border-status-danger/30 bg-status-danger/5 hover:bg-status-danger/10 transition-colors group">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-status-danger" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-status-danger">Lewat {Math.abs(daysUntilShort(t.dueDate))} hari</span>
                      <StatusBadge status={t.priority} type="priority" />
                    </div>
                    <div className="text-sm font-medium truncate group-hover:text-accent">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Tarikh akhir: {formatDate(t.dueDate)}</div>
                  </button>
                ))}
                {data?.todayTasks.map((t) => (
                  <button key={t.id} onClick={() => { setSelectedTaskId(t.id); setView("tasks"); }} className="w-full text-left p-3 rounded-md border border-border hover:bg-muted/40 transition-colors group">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">Hari ini</span>
                      <StatusBadge status={t.priority} type="priority" />
                    </div>
                    <div className="text-sm font-medium truncate group-hover:text-accent">{t.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{t.progress}%</span>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Initiatives */}
        <Card className="p-4 lg:p-5">
          <SectionHeader
            title="Inisiatif Terkini"
            subtitle="Sumbangan di luar tugasan rasmi"
            icon={Lightbulb}
            action={<Button size="sm" variant="ghost" onClick={() => setView("initiatives")} className="h-7 text-xs">Semua <ChevronRight className="w-3 h-3" /></Button>}
          />
          <div className="space-y-2">
            {data?.initiatives.length === 0 ? (
              <EmptyState icon={Lightbulb} title="Tiada inisiatif lagi" description="Hantar inisiatif anda untuk diiktiraf." action={<Button size="sm" onClick={() => setView("initiatives")}><Send className="w-3.5 h-3.5 mr-1.5" />Hantar Inisiatif</Button>} />
            ) : (
              data?.initiatives.map((i) => (
                <div key={i.id} className="p-3 rounded-md border border-border/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{i.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{relativeTime(i.submittedAt)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", i.status === "Disahkan" ? "bg-status-success/15 text-status-success" : i.status === "Ditolak" ? "bg-status-danger/15 text-status-danger" : "bg-status-warning/15 text-status-warning")}>
                        {i.status}
                      </span>
                      {i.status === "Disahkan" && (
                        <span className="text-xs font-semibold text-accent">+{i.points}p</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* GM feedback */}
        <Card className="p-4 lg:p-5">
          <SectionHeader title="Maklum Balas GM" subtitle="Komen terkini daripada GM" icon={MessageSquare} />
          <div className="space-y-2">
            {data?.recentFeedback.length === 0 ? (
              <EmptyState icon={MessageSquare} title="Tiada maklum balas" description="Maklum balas GM akan dipaparkan di sini." />
            ) : (
              data?.recentFeedback.map((f, i) => (
                <div key={i} className="p-3 rounded-md border border-border/60">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] text-primary-foreground font-semibold">GM</div>
                    <div className="text-xs font-medium">{f.authorName}</div>
                    <span className="text-[10px] text-muted-foreground">· {relativeTime(f.createdAt)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mb-1">{f.title}</div>
                  <div className="text-sm bg-muted/40 rounded p-2">{f.comment}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

function daysUntilShort(dateStr: string) {
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function gradeAccent(grade: string): "success" | "warning" | "danger" {
  if (grade === "A" || grade === "B") return "success";
  if (grade === "C") return "warning";
  return "danger";
}
