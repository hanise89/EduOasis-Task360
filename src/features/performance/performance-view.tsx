"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { PeriodSelector } from "@/components/common/period-selector";
import { ScoreRing } from "@/components/common/score-ring";
import { SectionHeader, LoadingCard, EmptyState, PageContainer } from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { initials, GRADE_META } from "@/lib/meta";
import type { StaffScore } from "@/types";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Gauge, ChevronDown, ChevronRight,
  Star, MessageSquare, Users, Award, Target,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";

const DIM_LABELS: Record<string, string> = {
  taskCompletion: "Penyiapan Tugasan", timeliness: "Ketepatan Masa", workQuality: "Kualiti Kerja",
  initiative: "Inisiatif & Penyelesaian", communication: "Komunikasi & Akauntabiliti", productivity: "Produktiviti & Beban",
};

export function PerformanceView() {
  const user = useAppStore((s) => s.user)!;
  const period = useAppStore((s) => s.period);
  const selectedStaffId = useAppStore((s) => s.selectedStaffId);
  const setSelectedStaffId = useAppStore((s) => s.setSelectedStaffId);

  // GM: can view all; staff: only self
  const targetUserId = user.role === "GM" ? (selectedStaffId || "") : user.id;

  if (user.role === "GM" && !targetUserId) {
    return <GmPerformanceOverview period={period} onSelectStaff={setSelectedStaffId} />;
  }
  return <StaffPerformanceDetail userId={targetUserId} period={period} />;
}

function GmPerformanceOverview({ period, onSelectStaff }: { period: any; onSelectStaff: (id: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["performance-all", period],
    queryFn: () => apiGet<{ scores: StaffScore[] }>("/api/performance/all?period=" + period),
  });
  const scores = data?.scores || [];
  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-3 flex-wrap border-b border-border pb-4">
        <div>
          <span className="eyebrow">PRESTASI STAF</span>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-1">Penilaian Prestasi Staf</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Skor 6 dimensi secara objektif &amp; berasaskan data</p>
        </div>
        <PeriodSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 lg:p-5 card-flat rounded-md">
          <SectionHeader title="Kedudukan Prestasi" subtitle="Klik staf untuk lihat butiran drill-down" icon={Users} index={1} eyebrow="Ranking" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {isLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)
            ) : scores.map((s, idx) => (
              <button key={s.userId} onClick={() => onSelectStaff(s.userId)} className="flex items-center gap-3 p-3 rounded-sm border border-border hover:border-border-strong hover:bg-muted/30 transition-colors text-left group">
                <span className={cn("w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold shrink-0 index-numeral", idx === 0 ? "bg-status-warning/15 text-status-warning" : idx === 1 ? "bg-muted-foreground/15 text-foreground" : idx === 2 ? "bg-status-danger/10 text-status-danger" : "bg-muted text-muted-foreground")}>{String(idx + 1).padStart(2, "0")}</span>
                <ScoreRing score={s.overall} size={44} thickness={5} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.userName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-sm font-medium border", GRADE_META[s.grade].bg, GRADE_META[s.grade].text, GRADE_META[s.grade].border)}>{s.grade} — {s.gradeLabel}</span>
                    {s.trend === "up" ? <TrendingUp className="w-3 h-3 text-status-success" /> : s.trend === "down" ? <TrendingDown className="w-3 h-3 text-status-danger" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground" />
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4 lg:p-5 card-flat rounded-md">
          <SectionHeader title="Perbandingan Dimensi" subtitle="Semua staf" icon={BarChart3} index={2} eyebrow="Perbandingan" />
          <ComparisonBarChart scores={scores} />
        </Card>
      </div>
    </PageContainer>
  );
}

function ComparisonBarChart({ scores }: { scores: StaffScore[] }) {
  if (scores.length === 0) return <EmptyState icon={BarChart3} title="Tiada data" />;
  const dims = ["taskCompletion", "timeliness", "workQuality", "initiative", "communication", "productivity"];
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--status-danger)"];
  const data = dims.map((d) => {
    const row: any = { dim: DIM_LABELS[d].split(" ")[0] };
    scores.forEach((s) => { row[s.userName.split(" ")[0]] = s.dimensions.find((x) => x.key === d)?.score || 0; });
    return row;
  });
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="dim" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 2, border: "1px solid var(--border)" }} />
          {scores.map((s, i) => (
            <Bar key={s.userId} dataKey={s.userName.split(" ")[0]} fill={colors[i % colors.length]} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StaffPerformanceDetail({ userId, period }: { userId: string; period: any }) {
  const user = useAppStore((s) => s.user)!;
  const setSelectedStaffId = useAppStore((s) => s.setSelectedStaffId);
  const [drilldown, setDrilldown] = useState<string | null>(null);
  const [accDialogOpen, setAccDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["performance", userId, period],
    queryFn: () => apiGet<{ score: StaffScore; trend: any[] }>(`/api/performance/${userId}?period=${period}`),
  });
  const { data: userData } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<{ users: any[] }>("/api/users"),
    enabled: user.role === "GM",
  });

  if (isLoading || !data?.score) {
    return <PageContainer><div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <LoadingCard key={i} />)}</div></PageContainer>;
  }
  const score = data.score;
  const trend = data.trend || [];
  const staffInfo = userData?.users.find((u) => u.id === userId);

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-3 flex-wrap border-b border-border pb-4">
        <div className="flex items-center gap-3">
          {user.role === "GM" && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedStaffId(null)} className="text-xs">
              <ChevronRight className="w-4 h-4 rotate-180" /> Semua Staf
            </Button>
          )}
          <div>
            <span className="eyebrow">PRESTASI INDIVIDU</span>
            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-1">{score.userName}</h1>
            {staffInfo && <p className="text-sm text-muted-foreground mt-0.5">{staffInfo.position}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector />
          {user.role === "GM" && (
            <Button size="sm" variant="outline" onClick={() => setAccDialogOpen(true)}>
              <Star className="w-3.5 h-3.5 mr-1" /> Rating Akauntabiliti
            </Button>
          )}
        </div>
      </div>

      {/* Overall + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:p-5 card-flat rounded-md flex flex-col items-center justify-center text-center">
          <div className="eyebrow mb-3">Skor Keseluruhan</div>
          <ScoreRing score={score.overall} grade={score.grade} showGrade size={140} thickness={12} />
          <div className={cn("mt-3 px-4 py-1.5 rounded-sm text-sm font-medium border", GRADE_META[score.grade].bg, GRADE_META[score.grade].text, GRADE_META[score.grade].border)}>
            {score.grade} — {score.gradeLabel}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground tabular-nums">
            {score.trend === "up" ? <><TrendingUp className="w-3.5 h-3.5 text-status-success" /> Meningkat</> : score.trend === "down" ? <><TrendingDown className="w-3.5 h-3.5 text-status-danger" /> Menurun</> : <><Minus className="w-3.5 h-3.5" /> Stabil</>}
            {score.previousOverall !== null && <span>vs {score.previousOverall} tempoh lepas</span>}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-4 lg:p-5 card-flat rounded-md">
          <SectionHeader title="Profil 6 Dimensi" subtitle={`Tempoh: ${score.period?.label}`} icon={Gauge} index={1} eyebrow="Profil Dimensi" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={score.dimensions.map((d) => ({ dim: DIM_LABELS[d.key], Skor: d.score, Pemberat: d.weight }))}
                outerRadius="70%"
                margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
              >
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} angle={90} />
                <Radar dataKey="Skor" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 2, border: "1px solid var(--border)" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Dimension score-summary cards with drill-down */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {score.dimensions.map((d, idx) => {
          const scoreColor = d.score >= 75 ? "text-status-success" : d.score >= 60 ? "text-status-warning" : "text-status-danger";
          const barColor = d.score >= 75 ? "bg-status-success" : d.score >= 60 ? "bg-status-warning" : "bg-status-danger";
          const contribution = Math.round((d.score * d.weight) / 100);
          return (
            <Card key={d.key} className="p-4 card-flat rounded-md">
              <button onClick={() => setDrilldown(drilldown === d.key ? null : d.key)} className="w-full text-left">
                {/* Top row: index + dimension name (eyebrow) + chevron */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="index-numeral text-[11px] leading-none select-none">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="eyebrow truncate">{d.name}</span>
                  </div>
                  {drilldown === d.key
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                </div>

                {/* Large score + auto/gm indicator */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={cn("text-3xl font-semibold tabular-nums num-display leading-none", scoreColor)}>{d.score}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">/100</span>
                  <div className="ml-auto flex items-center gap-1">
                    {d.isAutomatic
                      ? <span className="text-[9px] px-1 py-0.5 rounded-sm border border-status-success/30 bg-status-success/10 text-status-success">Auto</span>
                      : <span className="text-[9px] px-1 py-0.5 rounded-sm border border-accent/30 bg-accent/10 text-accent">GM</span>}
                  </div>
                </div>

                {/* Sharp 1px-tall horizontal bar */}
                <div className="h-1 bg-muted overflow-hidden rounded-none">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn("h-full rounded-none", barColor)}
                  />
                </div>

                {/* Contribution + pemberat */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                  <span>Pemberat {d.weight}%</span>
                  <span>Sumbangan {contribution}%</span>
                </div>
              </button>

              {/* Drill-down section */}
              <AnimatePresence>
                {drilldown === d.key && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="eyebrow mb-2">Drill-down Sumber Skor</div>
                      <div>
                        {d.details.map((det, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-b-0">
                            <span className="text-muted-foreground">{det.label}</span>
                            <span className="font-medium tabular-nums num-display">{det.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Trend chart */}
      <Card className="p-4 lg:p-5 card-flat rounded-md">
        <SectionHeader title="Trend 6 Bulan Terakhir" subtitle="Skor keseluruhan & dimensi utama" icon={TrendingUp} index={2} eyebrow="Trend" />
        {trend.length === 0 ? <EmptyState icon={TrendingUp} title="Tiada data trend" /> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 2, border: "1px solid var(--border)" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="overall" name="Keseluruhan" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="taskCompletion" name="Penyiapan" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="workQuality" name="Kualiti" stroke="var(--chart-3)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="timeliness" name="Ketepatan" stroke="var(--chart-4)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {user.role === "GM" && (
        <AccountabilityDialog open={accDialogOpen} onOpenChange={setAccDialogOpen} userId={userId} userName={score.userName} />
      )}
    </PageContainer>
  );
}

function AccountabilityDialog({ open, onOpenChange, userId, userName }: { open: boolean; onOpenChange: (o: boolean) => void; userId: string; userName: string }) {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Rating Akauntabiliti Bulanan</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="text-xs text-muted-foreground">Staf: <span className="font-medium text-foreground">{userName}</span></div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tempoh (Bulan)</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 rounded-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rating Akauntabiliti (1-5)</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} onClick={() => setRating(v)} className={cn("flex-1 h-10 rounded-sm text-sm font-medium transition-colors border tabular-nums", v <= rating ? "bg-status-warning text-white border-status-warning" : "bg-card text-muted-foreground border-border hover:bg-muted/70")}>{v}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Komen</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Catatan akauntabiliti..." className="rounded-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={async () => {
            await apiPost("/api/accountability", { userId, rating, comment, period });
            toast.success("Rating akauntabiliti disimpan.");
            onOpenChange(false); setComment("");
          }}><Star className="w-4 h-4 mr-1" /> Simpan Rating</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
