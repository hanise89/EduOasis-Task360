"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { apiGet } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { initials, formatDate, GRADE_META } from "@/lib/meta";
import type { StaffScore, DimensionScore, PeriodKey } from "@/types";

import { PeriodSelector } from "@/components/common/period-selector";
import { ScoreRing } from "@/components/common/score-ring";
import {
  SectionHeader,
  LoadingCard,
  EmptyState,
  PageContainer,
  StatusBadge,
} from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  FileText,
  FileDown,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  ChevronDown,
  ChevronRight,
  Star,
  Award,
  ClipboardList,
  ListChecks,
  Printer,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface ReportTask {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
  estimatedHours: number;
  reworkCount: number;
  rating: number | null;
}

interface ReportInitiative {
  id: string;
  title: string;
  impactLevel: string;
  points: number;
  verifiedAt: string | null;
}

interface ReportAccRating {
  period: string;
  rating: number;
  comment: string;
}

interface IndividualReport {
  score: StaffScore;
  tasks: ReportTask[];
  initiatives: ReportInitiative[];
  accountabilityRatings: ReportAccRating[];
}

interface TeamStaff {
  id: string;
  name: string;
  position: string;
  avatarColor: string;
  tasks: { userId: string; completed: number; overdue: number; active: number; total: number };
}

interface TeamReport {
  scores: StaffScore[];
  staff: TeamStaff[];
}

interface UserLite {
  id: string;
  name: string;
  position: string;
  avatarColor: string;
  role: string;
}

const IMPACT_META: Record<string, { label: string; text: string; bg: string }> = {
  "Kecil": { label: "Kecil", text: "text-muted-foreground", bg: "bg-muted" },
  "Sederhana": { label: "Sederhana", text: "text-status-warning", bg: "bg-status-warning/15" },
  "Besar": { label: "Besar", text: "text-status-success", bg: "bg-status-success/10" },
};

const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Minggu Ini",
  month: "Bulan Ini",
  quarter: "Suku Tahun",
  all: "Sepanjang Tahun",
};

// ============================================================
// Export helpers (client-side, no deps)
// ============================================================

function exportToCSV(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToPDF(title: string, htmlContent: string) {
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) {
    toast.error("Sila benarkan tetingkap pop-up untuk eksport PDF.");
    return;
  }
  const generatedAt = new Date().toLocaleString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const html = `<!DOCTYPE html><html lang="ms"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 28mm 18mm; color: #1a2332; background: #ffffff; font-size: 12px; line-height: 1.5; }
  h1 { color: #1F3A5F; font-size: 22px; margin: 0 0 2px 0; letter-spacing: -0.02em; }
  h2 { color: #1F3A5F; font-size: 14px; margin: 22px 0 8px 0; border-bottom: 2px solid #0E7C86; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
  h3 { color: #1F3A5F; font-size: 12px; margin: 14px 0 6px 0; }
  .subtitle { color: #64748b; font-size: 11px; margin: 0 0 16px 0; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 12px 0; font-size: 10.5px; }
  th { background: #1F3A5F; color: #ffffff; text-align: left; padding: 6px 8px; font-weight: 600; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1F3A5F; padding-bottom: 10px; margin-bottom: 14px; }
  .brand { font-size: 10px; color: #64748b; text-align: right; line-height: 1.4; }
  .brand strong { color: #1F3A5F; font-size: 11px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 8px 0 14px 0; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin: 8px 0 14px 0; }
  .metric { padding: 8px 10px; background: #f1f5f9; border-left: 3px solid #0E7C86; border-radius: 0 4px 4px 0; }
  .metric-label { font-size: 8.5px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 2px; }
  .metric-value { font-size: 18px; font-weight: 700; color: #1F3A5F; }
  .metric-hint { font-size: 9px; color: #64748b; margin-top: 2px; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; background: #f1f5f9; color: #1F3A5F; }
  .badge.success { background: #dcfce7; color: #166534; }
  .badge.warning { background: #fef3c7; color: #92400e; }
  .badge.danger { background: #fee2e2; color: #991b1b; }
  .badge.neutral { background: #f1f5f9; color: #475569; }
  .badge.accent { background: #ccfbf1; color: #0E7C86; }
  .score { font-weight: 700; font-size: 13px; color: #1F3A5F; }
  .score.high { color: #166534; }
  .score.mid { color: #92400e; }
  .score.low { color: #991b1b; }
  .profile { display: flex; gap: 14px; align-items: center; padding: 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 12px; }
  .avatar { width: 56px; height: 56px; border-radius: 50%; background: #1F3A5F; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; }
  .profile-name { font-size: 16px; font-weight: 700; color: #1F3A5F; }
  .profile-pos { font-size: 11px; color: #64748b; margin-top: 2px; }
  .dims { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0 14px 0; }
  .dim { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; }
  .dim-name { font-size: 10px; font-weight: 600; color: #1F3A5F; margin-bottom: 4px; display: flex; justify-content: space-between; }
  .dim-score { font-weight: 700; }
  .dim-bar { background: #e2e8f0; height: 5px; border-radius: 3px; overflow: hidden; margin: 4px 0; }
  .dim-bar-fill { height: 100%; background: #0E7C86; }
  .dim-details { font-size: 9.5px; color: #475569; margin-top: 4px; }
  .dim-details div { display: flex; justify-content: space-between; padding: 1px 0; }
  .rating-stars { color: #EAB308; letter-spacing: 1px; }
  .footer { margin-top: 28px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #64748b; text-align: center; }
  .note-box { padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #0E7C86; border-radius: 0 4px 4px 0; font-size: 11px; white-space: pre-wrap; min-height: 40px; }
  @media print {
    body { margin: 12mm 10mm; }
    .no-print { display: none !important; }
  }
</style></head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">EDUOASIS TASK360 · Laporan Prestasi Staf</p>
    </div>
    <div class="brand"><strong>Al Amin Edu Oasis</strong><br/>Dijana: ${escapeHtml(generatedAt)}</div>
  </div>
  ${htmlContent}
  <div class="footer">Sulit — Kegunaan Dalaman · Prototaip v1.0</div>
  <script>
    window.onload = function() { setTimeout(function() { window.focus(); window.print(); }, 300); };
  </script>
</body></html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scoreColorClass(score: number): string {
  if (score >= 75) return "text-status-success";
  if (score >= 60) return "text-status-warning";
  return "text-status-danger";
}

function scoreBarClass(score: number): string {
  if (score >= 75) return "bg-status-success";
  if (score >= 60) return "bg-status-warning";
  return "bg-status-danger";
}

function trendMeta(trend: "up" | "down" | "flat") {
  if (trend === "up") return { Icon: TrendingUp, label: "Meningkat", cls: "text-status-success" };
  if (trend === "down") return { Icon: TrendingDown, label: "Menurun", cls: "text-status-danger" };
  return { Icon: Minus, label: "Stabil", cls: "text-muted-foreground" };
}

function gradeBadgeClass(grade: string): string {
  const meta = GRADE_META[grade];
  return meta ? cn(meta.bg, meta.text) : "bg-muted text-muted-foreground";
}

function pdfGradeClass(grade: string): string {
  if (grade === "A" || grade === "B") return "success";
  if (grade === "C") return "warning";
  return "danger";
}

function pdfScoreClass(score: number): string {
  if (score >= 75) return "high";
  if (score >= 60) return "mid";
  return "low";
}

function pdfImpactClass(level: string): string {
  if (level === "Besar") return "success";
  if (level === "Sederhana") return "warning";
  return "neutral";
}

function stars(rating: number): string {
  return "★".repeat(Math.max(0, Math.min(5, Math.round(rating)))) +
    "☆".repeat(5 - Math.max(0, Math.min(5, Math.round(rating))));
}

// ============================================================
// Main view
// ============================================================

export function ReportsView() {
  const user = useAppStore((s) => s.user)!;
  const period = useAppStore((s) => s.period);
  const isGM = user.role === "GM";
  const [tab, setTab] = useState<"team" | "individual">("team");

  if (!isGM) {
    // Staff: directly render individual report
    return (
      <PageContainer>
        <PageHeader
          title="Laporan Prestasi"
          subtitle="Laporan individu prestasi anda"
        />
        <IndividualReportSection
          key={`${user.id}-${period}`}
          userId={user.id}
          period={period}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Laporan Prestasi"
        subtitle="Eksport & analisis prestasi pasukan serta individu"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "team" | "individual")}>
        <TabsList>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Laporan Pasukan
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Laporan Individu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <TeamReportSection period={period} />
        </TabsContent>
        <TabsContent value="individual" className="mt-4">
          <IndividualReportSectionForGM period={period} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// ============================================================
// Page header
// ============================================================

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Eksport &amp; Pelaporan
        </span>
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-0.5">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <PeriodSelector />
    </div>
  );
}

// ============================================================
// Team report (GM only)
// ============================================================

function TeamReportSection({ period }: { period: PeriodKey }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "team", period],
    queryFn: () => apiGet<TeamReport>(`/api/reports/team?period=${period}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <LoadingCard key={i} />)}
        </div>
        <Card className="p-4 lg:p-5">
          <Skeleton className="h-6 w-48 mb-4" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Gagal memuatkan laporan pasukan"
          description="Sila cuba lagi. Pastikan anda log masuk sebagai GM."
        />
      </Card>
    );
  }

  const scores = data?.scores || [];
  const staff = data?.staff || [];

  if (scores.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={Users}
          title="Tiada staf ditemui"
          description="Belum ada staf yang didaftarkan untuk laporan pasukan."
        />
      </Card>
    );
  }

  // KPIs
  const avgScore = Math.round(scores.reduce((s, x) => s + x.overall, 0) / scores.length);
  const totalStaff = staff.length;
  const totalCompleted = staff.reduce((s, x) => s + (x.tasks?.completed || 0), 0);
  const totalOverdue = staff.reduce((s, x) => s + (x.tasks?.overdue || 0), 0);

  // Merge staff with score (preserve staff order; rank by score desc)
  const ranked = [...scores].sort((a, b) => b.overall - a.overall);
  const rankMap = new Map<string, number>();
  ranked.forEach((s, i) => rankMap.set(s.userId, i + 1));

  const rows = staff.map((st) => {
    const sc = scores.find((s) => s.userId === st.id);
    return { staff: st, score: sc, rank: sc ? rankMap.get(st.id) || 0 : 0 };
  });

  const handleExportCSV = () => {
    const rows: string[][] = [
      ["Kedudukan", "Nama", "Jawatan", "Skor Keseluruhan", "Gred", "Label Gred", "Tugasan Siap", "Tugasan Tertunggak", "Tugasan Aktif", "Jumlah Tugasan", "Trend"],
      ...staff.map((st) => {
        const sc = scores.find((s) => s.userId === st.id);
        const t = st.tasks || { completed: 0, overdue: 0, active: 0, total: 0 };
        const rank = sc ? rankMap.get(st.id) || "" : "";
        const trend = sc ? (sc.trend === "up" ? "Meningkat" : sc.trend === "down" ? "Menurun" : "Stabil") : "";
        return [
          String(rank),
          st.name,
          st.position,
          sc ? String(sc.overall) : "—",
          sc?.grade || "—",
          sc?.gradeLabel || "—",
          String(t.completed),
          String(t.overdue),
          String(t.active),
          String(t.total),
          trend,
        ];
      }),
    ];
    exportToCSV(`laporan-pasukan-${period}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success("CSV pasukan telah dimuat turun.");
  };

  const handleExportPDF = () => {
    const kpisHtml = `
      <div class="grid-4">
        <div class="metric"><div class="metric-label">Purata Skor Pasukan</div><div class="metric-value">${avgScore}</div><div class="metric-hint">/ 100</div></div>
        <div class="metric"><div class="metric-label">Bilangan Staf</div><div class="metric-value">${totalStaff}</div></div>
        <div class="metric"><div class="metric-label">Tugasan Siap</div><div class="metric-value">${totalCompleted}</div></div>
        <div class="metric"><div class="metric-label">Tugasan Tertunggak</div><div class="metric-value">${totalOverdue}</div></div>
      </div>
    `;
    const tableHtml = `
      <h2>Kedudukan Prestasi Staf — ${escapeHtml(PERIOD_LABELS[period])}</h2>
      <table>
        <thead><tr>
          <th>#</th><th>Nama</th><th>Jawatan</th><th>Skor</th><th>Gred</th>
          <th>Siap</th><th>Tertunggak</th><th>Aktif</th><th>Jumlah</th><th>Trend</th>
        </tr></thead>
        <tbody>
          ${rows.map(({ staff: st, score: sc, rank }) => {
            const t = st.tasks || { completed: 0, overdue: 0, active: 0, total: 0 };
            const trend = sc ? trendMeta(sc.trend) : null;
            return `<tr>
              <td>${rank || "—"}</td>
              <td>${escapeHtml(st.name)}</td>
              <td>${escapeHtml(st.position)}</td>
              <td class="score ${sc ? pdfScoreClass(sc.overall) : ""}">${sc ? sc.overall : "—"}</td>
              <td><span class="badge ${sc ? pdfGradeClass(sc.grade) : "neutral"}">${sc ? sc.grade + " — " + sc.gradeLabel : "—"}</span></td>
              <td>${t.completed}</td>
              <td>${t.overdue}</td>
              <td>${t.active}</td>
              <td>${t.total}</td>
              <td>${trend ? trend.label : "—"}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
    exportToPDF(`Laporan Prestasi Pasukan — ${PERIOD_LABELS[period]}`, kpisHtml + tableHtml);
    toast.success("PDF pasukan sedang dijana.");
  };

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          label="Purata Skor Pasukan"
          value={avgScore}
          hint="/ 100"
          icon={Gauge}
          accent="primary"
        />
        <KpiTile
          label="Bilangan Staf"
          value={totalStaff}
          hint="Staf aktif"
          icon={Users}
          accent="accent"
        />
        <KpiTile
          label="Tugasan Siap"
          value={totalCompleted}
          hint="Jumlah pasukan"
          icon={CheckCircle2}
          accent="success"
        />
        <KpiTile
          label="Tugasan Tertunggak"
          value={totalOverdue}
          hint="Jumlah pasukan"
          icon={AlertTriangle}
          accent={totalOverdue > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Team table + export */}
      <Card className="p-4 lg:p-5">
        <SectionHeader
          title="Jadual Prestasi Staf"
          subtitle={`Tempoh: ${PERIOD_LABELS[period]}`}
          icon={ListChecks}
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <FileDown className="w-3.5 h-3.5 mr-1.5" /> Eksport CSV
              </Button>
              <Button size="sm" onClick={handleExportPDF}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Eksport PDF
              </Button>
            </div>
          }
        />
        <div className="max-h-[560px] overflow-y-auto scroll-slim rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">Jawatan</TableHead>
                <TableHead className="text-center">Skor</TableHead>
                <TableHead>Gred</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Siap</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Tertunggak</TableHead>
                <TableHead className="text-center hidden md:table-cell">Aktif</TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ staff: st, score: sc, rank }) => {
                const t = st.tasks || { completed: 0, overdue: 0, active: 0, total: 0 };
                const trend = sc ? trendMeta(sc.trend) : null;
                return (
                  <TableRow key={st.id}>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex w-6 h-6 items-center justify-center rounded text-[11px] font-bold",
                        rank === 1 ? "bg-status-warning/20 text-status-warning" :
                        rank === 2 ? "bg-muted-foreground/20 text-foreground" :
                        rank === 3 ? "bg-status-danger/15 text-status-danger" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {rank || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback style={{ backgroundColor: st.avatarColor, color: "#fff" }} className="text-[10px] font-semibold">
                            {initials(st.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm truncate">{st.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{st.position}</TableCell>
                    <TableCell className="text-center">
                      {sc ? (
                        <span className={cn("text-base font-bold tabular-nums", scoreColorClass(sc.overall))}>{sc.overall}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {sc && (
                        <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium", gradeBadgeClass(sc.grade))}>
                          {sc.grade} · {sc.gradeLabel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className="text-sm tabular-nums text-status-success font-medium">{t.completed}</span>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className={cn("text-sm tabular-nums font-medium", t.overdue > 0 ? "text-status-danger" : "text-muted-foreground")}>
                        {t.overdue}
                      </span>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <span className="text-sm tabular-nums text-muted-foreground">{t.active}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {trend && (
                        <span className={cn("inline-flex items-center justify-center gap-0.5 text-xs", trend.cls)}>
                          <trend.Icon className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "accent" | "success" | "warning" | "danger" | "neutral";
}) {
  const accentMap: Record<string, { bg: string; text: string; bar: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", bar: "bg-primary" },
    accent: { bg: "bg-accent/10", text: "text-accent", bar: "bg-accent" },
    success: { bg: "bg-status-success/10", text: "text-status-success", bar: "bg-status-success" },
    warning: { bg: "bg-status-warning/15", text: "text-status-warning", bar: "bg-status-warning" },
    danger: { bg: "bg-status-danger/10", text: "text-status-danger", bar: "bg-status-danger" },
    neutral: { bg: "bg-muted", text: "text-muted-foreground", bar: "bg-muted-foreground" },
  };
  const a = accentMap[accent];
  return (
    <Card className="p-4 card-flat relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] lg:text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-2xl lg:text-3xl font-semibold tracking-tight mt-1.5 tabular-nums"
          >
            {value}
          </motion.div>
          {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", a.bg, a.text)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={cn("absolute inset-x-0 top-0 h-0.5", a.bar)} />
    </Card>
  );
}

// ============================================================
// Individual report (GM picks staff)
// ============================================================

function IndividualReportSectionForGM({ period }: { period: PeriodKey }) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<{ users: UserLite[] }>("/api/users"),
  });

  const users = useMemo(() => {
    const all = usersData?.users || [];
    return all.filter((u) => u.role === "STAF");
  }, [usersData]);

  // Derive the effective staff id; no effect needed.
  const effectiveStaffId = selectedStaffId || users[0]?.id || "";

  if (usersLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LoadingCard className="lg:col-span-1" />
        <LoadingCard className="lg:col-span-2" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={Users}
          title="Tiada staf ditemui"
          description="Daftarkan staf terlebih dahulu untuk menjana laporan individu."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">
            Pilih Staf
          </Label>
          <Select value={effectiveStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Pilih staf…" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} — {u.position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {effectiveStaffId && (
        <IndividualReportSection
          key={`${effectiveStaffId}-${period}`}
          userId={effectiveStaffId}
          period={period}
        />
      )}
    </div>
  );
}

// ============================================================
// Individual report (renders for staff self OR GM-selected)
// ============================================================

function IndividualReportSection({ userId, period }: { userId: string; period: PeriodKey }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "individual", userId, period],
    queryFn: () => apiGet<IndividualReport>(`/api/reports/individual?userId=${userId}&period=${period}`),
  });
  const [drilldown, setDrilldown] = useState<string | null>(null);
  const [gmNote, setGmNote] = useState<string>("");
  const user = useAppStore((s) => s.user)!;
  const isGM = user.role === "GM";

  // Note: parent passes key={`${userId}-${period}`} so local state (drilldown, gmNote)
  // resets naturally on staff/period change without an effect.

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <LoadingCard className="lg:col-span-1" />
          <LoadingCard className="lg:col-span-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <LoadingCard key={i} />)}
        </div>
      </div>
    );
  }

  if (isError || !data?.score) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Laporan tidak tersedia"
          description="Tidak dapat memuatkan laporan individu. Sila cuba lagi."
        />
      </Card>
    );
  }

  const { score, tasks, initiatives, accountabilityRatings } = data;
  const scoreUserInfo = isGM
    ? { name: score.userName, position: usersPositionHint(data) }
    : { name: user.name, position: user.position };
  const trend = trendMeta(score.trend);

  // CSV exports ----------------------------------------------------
  const handleExportTasksCSV = () => {
    const rows: string[][] = [
      ["Tajuk", "Kategori", "Status", "Keutamaan", "Tarikh Akhir", "Tarikh Siap", "Anggaran Jam", "Semakan Semula", "Rating"],
      ...tasks.map((t) => [
        t.title,
        t.category,
        t.status,
        t.priority,
        formatDate(t.dueDate),
        t.completedAt ? formatDate(t.completedAt) : "—",
        String(t.estimatedHours),
        String(t.reworkCount),
        t.rating !== null ? t.rating.toFixed(2) : "—",
      ]),
    ];
    exportToCSV(`laporan-tugasan-${score.userName}-${period}.csv`, rows);
    toast.success("CSV tugasan telah dimuat turun.");
  };

  // PDF export -----------------------------------------------------
  const handleExportPDF = () => {
    const profileHtml = `
      <div class="profile">
        <div class="avatar">${escapeHtml(initials(score.userName))}</div>
        <div>
          <div class="profile-name">${escapeHtml(score.userName)}</div>
          <div class="profile-pos">${escapeHtml(scoreUserInfo.position)} · Tempoh: ${escapeHtml(PERIOD_LABELS[period])} (${escapeHtml(score.period?.label || "")})</div>
        </div>
        <div style="margin-left:auto;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:${pdfScoreHex(score.overall)};">${score.overall}</div>
          <div style="font-size:10px;color:#64748b;">Skor Keseluruhan</div>
          <div class="badge ${pdfGradeClass(score.grade)}" style="margin-top:4px;">${score.grade} — ${escapeHtml(score.gradeLabel)}</div>
        </div>
      </div>
    `;

    const dimsHtml = `
      <h2>Profil 6 Dimensi</h2>
      <div class="dims">
        ${score.dimensions.map((d) => `
          <div class="dim">
            <div class="dim-name">
              <span>${escapeHtml(d.name)}</span>
              <span class="dim-score">${d.score}</span>
            </div>
            <div class="dim-bar"><div class="dim-bar-fill" style="width:${Math.max(0, Math.min(100, d.score))}%;"></div></div>
            <div class="dim-details">
              <div><span>Pemberat</span><span>${d.weight}%</span></div>
              ${d.details.map((det) => `<div><span>${escapeHtml(det.label)}</span><span>${escapeHtml(det.value)}</span></div>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;

    const tasksHtml = tasks.length === 0 ? "" : `
      <h2>Senarai Tugasan (${tasks.length})</h2>
      <table>
        <thead><tr>
          <th>Tajuk</th><th>Kategori</th><th>Status</th><th>Keutamaan</th>
          <th>Tarikh Akhir</th><th>Siap Pada</th><th>Rating</th><th>Semakan Semula</th>
        </tr></thead>
        <tbody>
          ${tasks.map((t) => `<tr>
            <td>${escapeHtml(t.title)}</td>
            <td>${escapeHtml(t.category)}</td>
            <td>${escapeHtml(t.status)}</td>
            <td>${escapeHtml(t.priority)}</td>
            <td>${escapeHtml(formatDate(t.dueDate))}</td>
            <td>${t.completedAt ? escapeHtml(formatDate(t.completedAt)) : "—"}</td>
            <td>${t.rating !== null ? t.rating.toFixed(2) : "—"}</td>
            <td>${t.reworkCount}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    const initHtml = initiatives.length === 0 ? "" : `
      <h2>Inisiatif Disahkan (${initiatives.length})</h2>
      <table>
        <thead><tr><th>Tajuk</th><th>Impak</th><th>Mata</th><th>Disahkan Pada</th></tr></thead>
        <tbody>
          ${initiatives.map((i) => `<tr>
            <td>${escapeHtml(i.title)}</td>
            <td><span class="badge ${pdfImpactClass(i.impactLevel)}">${escapeHtml(i.impactLevel)}</span></td>
            <td>${i.points}</td>
            <td>${i.verifiedAt ? escapeHtml(formatDate(i.verifiedAt)) : "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    const accHtml = accountabilityRatings.length === 0 ? "" : `
      <h2>Rating Akauntabiliti</h2>
      <table>
        <thead><tr><th>Tempoh</th><th>Rating</th><th>Komen</th></tr></thead>
        <tbody>
          ${accountabilityRatings.map((a) => `<tr>
            <td>${escapeHtml(a.period)}</td>
            <td><span class="rating-stars">${stars(a.rating)}</span> (${a.rating}/5)</td>
            <td>${escapeHtml(a.comment || "—")}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    const noteHtml = (isGM && gmNote.trim()) ? `
      <h2>Catatan GM / Pelan Tindakan</h2>
      <div class="note-box">${escapeHtml(gmNote.trim())}</div>
    ` : "";

    exportToPDF(
      `Laporan Individu — ${score.userName} (${PERIOD_LABELS[period]})`,
      profileHtml + dimsHtml + tasksHtml + initHtml + accHtml + noteHtml,
    );
    toast.success("PDF individu sedang dijana.");
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:p-5 flex flex-col items-center justify-center text-center">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Skor Keseluruhan</div>
          <ScoreRing score={score.overall} grade={score.grade} showGrade size={140} thickness={12} />
          <div className={cn("mt-3 px-4 py-1.5 rounded-full text-sm font-medium", gradeBadgeClass(score.grade))}>
            {score.grade} — {score.gradeLabel}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <trend.Icon className={cn("w-3.5 h-3.5", trend.cls)} />
            <span className={trend.cls}>{trend.label}</span>
            {score.previousOverall !== null && <span>· vs {score.previousOverall} sebelum</span>}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-4 lg:p-5">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 shrink-0">
              <AvatarFallback
                style={{ backgroundColor: userAvatarColor(data, user), color: "#fff" }}
                className="text-lg font-semibold"
              >
                {initials(score.userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Laporan Individu</span>
              <h2 className="text-xl font-semibold tracking-tight mt-0.5 truncate">{score.userName}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{scoreUserInfo.position}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60">
                  <ClipboardList className="w-3 h-3 text-muted-foreground" />
                  Tempoh: <span className="font-medium">{PERIOD_LABELS[period]}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60">
                  {score.period?.label && <span className="font-medium">{score.period.label}</span>}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60">
                  <CheckCircle2 className="w-3 h-3 text-status-success" />
                  {tasks.length} tugasan
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60">
                  <Award className="w-3 h-3 text-accent" />
                  {initiatives.length} inisiatif
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
            <Button size="sm" onClick={handleExportPDF}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Eksport PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportTasksCSV}>
              <FileDown className="w-3.5 h-3.5 mr-1.5" /> Eksport CSV Tugasan
            </Button>
          </div>
        </Card>
      </div>

      {/* Dimension cards */}
      <div>
        <SectionHeader
          title="6 Dimensi Prestasi"
          subtitle="Klik untuk butiran drill-down sumber skor"
          icon={Gauge}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {score.dimensions.map((d) => (
            <DimensionCard
              key={d.key}
              dim={d}
              open={drilldown === d.key}
              onToggle={() => setDrilldown(drilldown === d.key ? null : d.key)}
            />
          ))}
        </div>
      </div>

      {/* Tasks table */}
      <Card className="p-4 lg:p-5">
        <SectionHeader
          title="Senarai Tugasan"
          subtitle={`${tasks.length} tugasan dalam tempoh ini`}
          icon={ListChecks}
        />
        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Tiada tugasan" description="Tiada tugasan ditemui untuk tempoh ini." />
        ) : (
          <div className="max-h-[420px] overflow-y-auto scroll-slim rounded-md border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Tajuk</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Keutamaan</TableHead>
                  <TableHead className="hidden md:table-cell">Tarikh Akhir</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Rating</TableHead>
                  <TableHead className="text-center">Semakan Semula</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm max-w-[260px] truncate">{t.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{t.category}</TableCell>
                    <TableCell><StatusBadge status={t.status} type="task" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><StatusBadge status={t.priority} type="priority" /></TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">{formatDate(t.dueDate)}</TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      {t.rating !== null ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <Star className="w-3 h-3 fill-status-warning text-status-warning" />
                          {t.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "text-xs tabular-nums font-medium",
                        t.reworkCount > 0 ? "text-status-warning" : "text-muted-foreground"
                      )}>
                        {t.reworkCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Initiatives */}
        <Card className="p-4 lg:p-5">
          <SectionHeader
            title="Inisiatif Disahkan"
            subtitle={`${initiatives.length} inisiatif`}
            icon={Award}
          />
          {initiatives.length === 0 ? (
            <EmptyState icon={Award} title="Tiada inisiatif" description="Belum ada inisiatif disahkan dalam tempoh ini." />
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto scroll-slim">
              {initiatives.map((i) => {
                const imp = IMPACT_META[i.impactLevel] || IMPACT_META["Kecil"];
                return (
                  <li key={i.id} className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{i.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className={cn("inline-flex px-1.5 py-0.5 rounded font-medium", imp.bg, imp.text)}>{imp.label}</span>
                        <span>{i.points} mata</span>
                        {i.verifiedAt && <span>· {formatDate(i.verifiedAt)}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Accountability ratings */}
        <Card className="p-4 lg:p-5">
          <SectionHeader
            title="Rating Akauntabiliti"
            subtitle={`${accountabilityRatings.length} rekod terkini`}
            icon={Star}
          />
          {accountabilityRatings.length === 0 ? (
            <EmptyState icon={Star} title="Tiada rating" description="Belum ada rating akauntabiliti direkodkan." />
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto scroll-slim">
              {accountabilityRatings.map((a, i) => (
                <li key={i} className="p-3 rounded-md border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{a.period}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star
                          key={v}
                          className={cn(
                            "w-3.5 h-3.5",
                            v <= a.rating ? "fill-status-warning text-status-warning" : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                      <span className="text-xs font-semibold ml-1 tabular-nums">{a.rating}/5</span>
                    </div>
                  </div>
                  {a.comment && <p className="text-xs text-muted-foreground mt-1">{a.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* GM note / action plan */}
      <Card className="p-4 lg:p-5">
        <SectionHeader
          title="Catatan GM / Pelan Tindakan"
          subtitle={isGM ? "Catatan tempatan — tidak disimpan ke pelayan" : "Catatan peribadi — tidak disimpan ke pelayan"}
          icon={ClipboardList}
        />
        <Textarea
          value={gmNote}
          onChange={(e) => setGmNote(e.target.value)}
          placeholder={isGM
            ? "Tulis catatan pemulihan, kekuatan, atau pelan tindakan untuk staf ini…"
            : "Tulis refleksi peribadi atau pelan penambahbaikan…"}
          rows={4}
          className="resize-y"
        />
        <p className="text-[11px] text-muted-foreground mt-2">
          Nota: Catatan ini kekal dalam pelayar sahaja dan akan dimasukkan ke dalam PDF jika diisi.
        </p>
      </Card>
    </div>
  );
}

function DimensionCard({
  dim,
  open,
  onToggle,
}: {
  dim: DimensionScore;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="p-4">
      <button onClick={onToggle} className="w-full text-left" aria-expanded={open}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", scoreBarClass(dim.score))} />
            <span className="text-xs font-medium truncate">{dim.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground">Pemberat {dim.weight}%</span>
            {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className={cn("text-2xl font-semibold tabular-nums", scoreColorClass(dim.score))}>{dim.score}</span>
          <span className="text-xs text-muted-foreground mb-1">/ 100</span>
          <div className="ml-auto flex items-center gap-1">
            {dim.isAutomatic ? (
              <span className="text-[9px] px-1 py-0.5 rounded bg-status-success/10 text-status-success">Auto</span>
            ) : (
              <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent">GM</span>
            )}
            {dim.isGmRated && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">Dinilai GM</span>
            )}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, dim.score))}%` }}
            transition={{ duration: 0.5 }}
            className={cn("h-full rounded-full", scoreBarClass(dim.score))}
          />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Drill-down Sumber Skor
              </div>
              {dim.details.map((det, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <span className="text-muted-foreground truncate">{det.label}</span>
                  <span className="font-medium tabular-nums text-right shrink-0">{det.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ============================================================
// Small helpers
// ============================================================

function userAvatarColor(data: IndividualReport | undefined, user: { avatarColor?: string }): string {
  // The individual report payload doesn't include avatarColor; fall back to brand sea blue.
  return user?.avatarColor || "#1F3A5F";
}

function usersPositionHint(data: IndividualReport): string {
  // score payload doesn't include position; show the period label as fallback context
  return data?.score?.period?.label ? `Tempoh: ${data.score.period.label}` : "Staf";
}

function pdfScoreHex(score: number): string {
  if (score >= 75) return "#166534";
  if (score >= 60) return "#92400e";
  return "#991b1b";
}
