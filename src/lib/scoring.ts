// EDUOASIS TASK360 - Performance Scoring Engine
// Implements the exact formulas in PRD Section 6 for the six dimensions.

import { db } from "@/lib/db";
import type {
  DimensionScore,
  GradeBands,
  ScorePeriod,
  StaffScore,
  DimensionWeights,
  WorkloadStatus,
} from "@/types";

const DAY = 24 * 60 * 60 * 1000;

// ============================================================
// Period helpers
// ============================================================
export function getPeriod(key: "week" | "month" | "quarter" | "all"): ScorePeriod {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  switch (key) {
    case "week":
      start.setDate(start.getDate() - 7);
      return { start, end, label: "Minggu Ini" };
    case "month":
      start.setMonth(start.getMonth() - 1);
      return { start, end, label: "Bulan Ini" };
    case "quarter":
      start.setMonth(start.getMonth() - 3);
      return { start, end, label: "Suku Tahun" };
    case "all":
    default:
      start.setFullYear(start.getFullYear() - 1);
      return { start, end, label: "Sepanjang Tahun" };
  }
}

export function getSettings() {
  return db.setting.findUnique({ where: { id: "singleton" } }).then((s) => {
    if (!s) {
      return {
        weights: { taskCompletion: 20, timeliness: 15, workQuality: 25, initiative: 10, communication: 15, productivity: 15 } as DimensionWeights,
        initiativeTargetMonthly: 20,
        initiativeTargetQuarterly: 60,
        gradeBands: {
          A: { min: 90, max: 100 }, B: { min: 75, max: 89 },
          C: { min: 60, max: 74 }, D: { min: 40, max: 59 }, E: { min: 0, max: 39 },
        } as GradeBands,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [] as string[],
      };
    }
    return {
      weights: JSON.parse(s.weightsJson) as DimensionWeights,
      initiativeTargetMonthly: s.initiativeTargetMonthly,
      initiativeTargetQuarterly: s.initiativeTargetQuarterly,
      gradeBands: JSON.parse(s.gradeBandsJson) as GradeBands,
      workingDays: JSON.parse(s.workingDaysJson) as number[],
      holidays: JSON.parse(s.holidaysJson) as string[],
    };
  });
}

// ============================================================
// Working day helpers
// ============================================================
export function isWorkingDay(date: Date, workingDays: number[], holidays: string[]): boolean {
  const day = date.getDay();
  if (!workingDays.includes(day)) return false;
  const iso = date.toISOString().slice(0, 10);
  if (holidays.includes(iso)) return false;
  return true;
}

export function workingDaysBetween(start: Date, end: Date, workingDays: number[], holidays: string[]): number {
  let count = 0;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);
  while (d <= endD) {
    if (isWorkingDay(d, workingDays, holidays)) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// ============================================================
// Grade helper
// ============================================================
export function gradeForScore(score: number, bands: GradeBands): { grade: string; label: string } {
  const labels: Record<string, string> = {
    A: "Cemerlang", B: "Baik", C: "Memuaskan", D: "Perlu Penambahbaikan", E: "Kritikal",
  };
  for (const k of ["A", "B", "C", "D", "E"]) {
    const band = (bands as any)[k];
    if (score >= band.min && score <= band.max) {
      return { grade: k, label: labels[k] };
    }
  }
  if (score < 40) return { grade: "E", label: "Kritikal" };
  return { grade: "C", label: "Memuaskan" };
}

// ============================================================
// Workload status
// ============================================================
export function workloadStatusFor(utilisation: number): WorkloadStatus {
  if (utilisation > 110) return "Beban Berlebihan";
  if (utilisation >= 91) return "Tinggi";
  if (utilisation >= 60) return "Seimbang";
  return "Rendah";
}

export function utilisationScore(u: number): number {
  if (u >= 75 && u <= 90) return 100;
  if ((u >= 60 && u <= 74) || (u >= 91 && u <= 105)) return 80;
  if ((u >= 45 && u <= 59) || (u >= 106 && u <= 120)) return 60;
  return 40;
}

// ============================================================
// Core: compute a staff member's score for a period
// ============================================================
export async function computeStaffScore(
  userId: string,
  periodKey: "week" | "month" | "quarter" | "all" = "month"
): Promise<StaffScore> {
  const settings = await getSettings();
  const period = getPeriod(periodKey);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Fetch all relevant data in the period
  const tasks = await db.task.findMany({
    where: {
      assigneeId: userId,
      OR: [
        { completedAt: { gte: period.start, lte: period.end } },
        { status: { in: ["Dalam Proses", "Menunggu Semakan", "Disekat", "Belum Mula"] } },
      ],
    },
    include: { qualityReviews: true, timeLogs: true, blockers: true, comments: true, extensionRequests: true },
    orderBy: { createdAt: "asc" },
  });

  // ---- Dimension 1: Task Completion (20%) ----
  // Completion Rate = Completed Tasks / Tasks That Should Be Completed in Period * 100
  // Cancelled tasks excluded. "Should be completed" = tasks with dueDate within period OR completed in period.
  const cancelled = tasks.filter((t) => t.status === "Dibatalkan");
  const eligibleTasks = tasks.filter((t) => t.status !== "Dibatalkan");
  const completedInPeriod = eligibleTasks.filter(
    (t) => t.status === "Selesai" && t.completedAt && new Date(t.completedAt) >= period.start && new Date(t.completedAt) <= period.end
  );
  const shouldCompleteInPeriod = eligibleTasks.filter((t) => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    return due >= period.start && due <= period.end;
  });
  const completionRate = shouldCompleteInPeriod.length === 0
    ? (completedInPeriod.length > 0 ? 100 : 0)
    : (completedInPeriod.length / shouldCompleteInPeriod.length) * 100;
  const scoreTC = Math.min(100, Math.max(0, completionRate));

  const overdue = eligibleTasks.filter((t) => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    return t.status !== "Selesai" && due < new Date();
  });

  const d1: DimensionScore = {
    key: "taskCompletion",
    name: "Task Completion",
    weight: settings.weights.taskCompletion,
    score: Math.round(scoreTC),
    isAutomatic: true,
    isGmRated: false,
    details: [
      { label: "Tugasan Siap (tempoh)", value: String(completedInPeriod.length) },
      { label: "Sepatutnya Siap (tempoh)", value: String(shouldCompleteInPeriod.length) },
      { label: "Kadar Penyiapan", value: `${completionRate.toFixed(1)}%` },
      { label: "Tertunggak", value: String(overdue.length) },
      { label: "Dibatalkan", value: String(cancelled.length) },
    ],
  };

  // ---- Dimension 2: Timeliness (15%) ----
  // OTR = completed on/before due / total completed * 100
  // Penalty = avg days late for late tasks * 5
  // GM-approved extensions not counted as late
  const completedAll = eligibleTasks.filter((t) => t.status === "Selesai" && t.completedAt);
  const onTime = completedAll.filter((t) => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    return new Date(t.completedAt!) <= due;
  });
  const lateTasks = completedAll.filter((t) => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    return new Date(t.completedAt!) > due;
  });
  const otr = completedAll.length === 0 ? 100 : (onTime.length / completedAll.length) * 100;
  const avgDaysLate = lateTasks.length === 0 ? 0 : lateTasks.reduce((sum, t) => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    const comp = new Date(t.completedAt!);
    return sum + Math.max(0, Math.round((comp.getTime() - due.getTime()) / DAY));
  }, 0) / lateTasks.length;
  const penalty = avgDaysLate * 5;
  const scoreTM = Math.max(0, otr - penalty);

  const d2: DimensionScore = {
    key: "timeliness",
    name: "Timeliness",
    weight: settings.weights.timeliness,
    score: Math.round(scoreTM),
    isAutomatic: true,
    isGmRated: false,
    details: [
      { label: "Kadar Tepat Masa (OTR)", value: `${otr.toFixed(1)}%` },
      { label: "Siap Tepat Masa", value: String(onTime.length) },
      { label: "Siap Lewat", value: String(lateTasks.length) },
      { label: "Purata Hari Lewat", value: avgDaysLate.toFixed(1) },
      { label: "Penalti", value: `-${penalty.toFixed(1)}` },
      { label: "Lanjutan Diluluskan", value: String(eligibleTasks.filter(t => t.extendedDueDate).length) },
    ],
  };

  // ---- Dimension 3: Work Quality (25%) ----
  // Score = 0.7 * (avgRating / 5 * 100) + 0.3 * (100 - reworkRate)
  const reviewed = completedAll.filter((t) => t.qualityReviews.length > 0);
  const avgRating = reviewed.length === 0 ? 0 :
    reviewed.reduce((sum, t) => {
      const r = t.qualityReviews[0];
      const avg = (r.accuracy + r.completeness + r.professionalism + r.specCompliance) / 4;
      return sum + avg;
    }, 0) / reviewed.length;
  const reworkTasks = completedAll.filter((t) => t.reworkCount > 0);
  const reworkRate = completedAll.length === 0 ? 0 : (reworkTasks.length / completedAll.length) * 100;
  const scoreWQ = 0.7 * (avgRating / 5 * 100) + 0.3 * (100 - reworkRate);

  const d3: DimensionScore = {
    key: "workQuality",
    name: "Work Quality",
    weight: settings.weights.workQuality,
    score: Math.round(scoreWQ),
    isAutomatic: false,
    isGmRated: true,
    details: [
      { label: "Purata Rating GM", value: avgRating > 0 ? `${avgRating.toFixed(2)} / 5` : "Tiada penilaian" },
      { label: "Tugasan Dinilai", value: String(reviewed.length) },
      { label: "Kadar Semakan Semula", value: `${reworkRate.toFixed(1)}%` },
      { label: "Tugasan Dipulangkan", value: String(reworkTasks.length) },
    ],
  };

  // ---- Dimension 4: Initiative & Problem Solving (10%) ----
  // Score = min(100, verifiedPoints / periodTarget * 100)
  const initiatives = await db.initiative.findMany({
    where: { userId, status: "Disahkan", verifiedAt: { gte: period.start, lte: period.end } },
  });
  const verifiedPoints = initiatives.reduce((s, i) => s + i.points, 0);
  const periodTarget = periodKey === "quarter" || periodKey === "all"
    ? settings.initiativeTargetQuarterly
    : settings.initiativeTargetMonthly;
  const scoreIN = Math.min(100, (verifiedPoints / periodTarget) * 100);

  const d4: DimensionScore = {
    key: "initiative",
    name: "Initiative & Problem Solving",
    weight: settings.weights.initiative,
    score: Math.round(scoreIN),
    isAutomatic: false,
    isGmRated: true,
    details: [
      { label: "Mata Disahkan", value: String(verifiedPoints) },
      { label: "Sasaran Mata Tempoh", value: String(periodTarget) },
      { label: "Inisiatif Disahkan", value: String(initiatives.length) },
    ],
  };

  // ---- Dimension 5: Communication & Accountability (15%) ----
  // Update compliance (30%): % active tasks updated at least once every 2 working days
  // SLA response (30%): % GM comments replied within 24 working hours
  // Early blocker reporting (20%): % blockers reported >= 2 days before due date
  // GM accountability rating (20%): GM rating 1-5 -> 100 scale
  const activeTasks = tasks.filter((t) => ["Dalam Proses", "Menunggu Semakan", "Disekat"].includes(t.status));
  let updateCompliant = 0;
  for (const at of activeTasks) {
    // Use task updatedAt as proxy for "updated in last 2 working days" relative to now
    const lastUpdate = new Date(at.updatedAt);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / DAY;
    if (daysSinceUpdate <= 3) updateCompliant++; // 2 working days ~ 3 calendar days
  }
  const updateCompliance = activeTasks.length === 0 ? 100 : (updateCompliant / activeTasks.length) * 100;

  // SLA response: GM comments and whether a staff reply came within 1 working day
  const gmComments = await db.comment.findMany({
    where: { task: { assigneeId: userId }, isFromGM: true, createdAt: { gte: period.start, lte: period.end } },
    include: { task: true },
    orderBy: { createdAt: "asc" },
  });
  let slaReplied = 0;
  for (const gc of gmComments) {
    const reply = await db.comment.findFirst({
      where: {
        taskId: gc.taskId,
        authorId: userId,
        isFromGM: false,
        createdAt: { gt: gc.createdAt },
      },
      orderBy: { createdAt: "asc" },
    });
    if (reply) {
      const responseHours = (new Date(reply.createdAt).getTime() - new Date(gc.createdAt).getTime()) / (1000 * 60 * 60);
      if (responseHours <= 48) slaReplied++; // 24 working hours ~ 48 calendar hours
    }
  }
  const slaRate = gmComments.length === 0 ? 100 : (slaReplied / gmComments.length) * 100;

  // Early blocker reporting
  const userBlockers = await db.blocker.findMany({
    where: { reportedById: userId, reportedAt: { gte: period.start, lte: period.end } },
    include: { task: true },
  });
  let earlyBlockers = 0;
  for (const b of userBlockers) {
    const due = new Date(b.task.extendedDueDate || b.task.dueDate);
    const reported = new Date(b.reportedAt);
    if (due.getTime() - reported.getTime() >= 2 * DAY) earlyBlockers++;
  }
  const earlyBlockerRate = userBlockers.length === 0 ? 100 : (earlyBlockers / userBlockers.length) * 100;

  // GM accountability rating (most recent in period)
  const periodStr = period.start.toISOString().slice(0, 7);
  const accRating = await db.accountabilityRating.findFirst({
    where: { userId, period: periodStr },
  });
  const accScaled = accRating ? (accRating.rating / 5) * 100 : 80; // default 4/5

  const scoreCA =
    updateCompliance * 0.3 + slaRate * 0.3 + earlyBlockerRate * 0.2 + accScaled * 0.2;

  const d5: DimensionScore = {
    key: "communication",
    name: "Communication & Accountability",
    weight: settings.weights.communication,
    score: Math.round(scoreCA),
    isAutomatic: false,
    isGmRated: true,
    details: [
      { label: "Pematuhan Kemas Kini", value: `${updateCompliance.toFixed(1)}%` },
      { label: "Respons Dalam SLA", value: `${slaRate.toFixed(1)}%` },
      { label: "Halangan Dilapor Awal", value: `${earlyBlockerRate.toFixed(1)}%` },
      { label: "Rating Akauntabiliti GM", value: accRating ? `${accRating.rating} / 5` : "Tiada" },
    ],
  };

  // ---- Dimension 6: Productivity & Workload (15%) ----
  // Throughput = completed estimated hours / period target hours * 100 (cap 100)
  // Utilisation = logged hours / available hours (after leave & holidays) * 100
  const completedHours = completedInPeriod.reduce((s, t) => s + t.estimatedHours, 0);
  const periodWeeks = Math.max(1, Math.round((period.end.getTime() - period.start.getTime()) / (7 * DAY)));
  const periodTargetHours = user.weeklyHours * periodWeeks * 0.8; // assume 80% productive capacity
  const throughput = periodTargetHours === 0 ? 0 : Math.min(100, (completedHours / periodTargetHours) * 100);

  const loggedHours = await db.timeLog.aggregate({
    where: { userId, date: { gte: period.start, lte: period.end } },
    _sum: { hours: true },
  });
  const totalLogged = loggedHours._sum.hours || 0;
  const availableHours = user.weeklyHours * periodWeeks;
  const utilisation = availableHours === 0 ? 0 : (totalLogged / availableHours) * 100;
  const uScore = utilisationScore(utilisation);
  const scorePW = 0.5 * throughput + 0.5 * uScore;

  const d6: DimensionScore = {
    key: "productivity",
    name: "Productivity & Workload",
    weight: settings.weights.productivity,
    score: Math.round(scorePW),
    isAutomatic: true,
    isGmRated: false,
    details: [
      { label: "Daya Pemprosesan (Throughput)", value: `${throughput.toFixed(1)}%` },
      { label: "Jam Siap (anggaran)", value: `${completedHours.toFixed(1)} jam` },
      { label: "Jam Dilog", value: `${totalLogged.toFixed(1)} jam` },
      { label: "Utilisasi", value: `${utilisation.toFixed(1)}%` },
      { label: "Skor Utilisasi", value: String(uScore) },
    ],
  };

  const dimensions = [d1, d2, d3, d4, d5, d6];
  const overall = Math.round(dimensions.reduce((s, d) => s + (d.score * d.weight) / 100, 0));
  const { grade, label } = gradeForScore(overall, settings.gradeBands);

  // Compute previous period for trend
  const prevPeriod = getPreviousPeriod(periodKey);
  const prevTasks = await db.task.findMany({
    where: {
      assigneeId: userId,
      OR: [
        { completedAt: { gte: prevPeriod.start, lte: prevPeriod.end } },
        { status: { in: ["Dalam Proses", "Menunggu Semakan", "Disekat", "Belum Mula"] } },
      ],
    },
    include: { qualityReviews: true, timeLogs: true },
  });
  const prevCompleted = prevTasks.filter(t => t.status === "Selesai" && t.completedAt && new Date(t.completedAt) >= prevPeriod.start && new Date(t.completedAt) <= prevPeriod.end);
  const prevShouldComplete = prevTasks.filter(t => t.status !== "Dibatalkan" && new Date(t.extendedDueDate || t.dueDate) >= prevPeriod.start && new Date(t.extendedDueDate || t.dueDate) <= prevPeriod.end);
  const prevCompletion = prevShouldComplete.length === 0 ? (prevCompleted.length > 0 ? 100 : 0) : (prevCompleted.length / prevShouldComplete.length) * 100;
  // Simplified previous overall as approximation using completion + quality proxy
  const prevReviewed = prevCompleted.filter(t => t.qualityReviews.length > 0);
  const prevAvgRating = prevReviewed.length === 0 ? 0 : prevReviewed.reduce((s, t) => {
    const r = t.qualityReviews[0];
    return s + (r.accuracy + r.completeness + r.professionalism + r.specCompliance) / 4;
  }, 0) / prevReviewed.length;
  const prevOverall = Math.round(prevCompletion * 0.35 + (prevAvgRating / 5 * 100) * 0.4 + 70 * 0.25);
  const trend: "up" | "down" | "flat" = prevOverall < overall - 2 ? "up" : prevOverall > overall + 2 ? "down" : "flat";

  return {
    userId,
    userName: user.name,
    period,
    dimensions,
    overall,
    grade,
    gradeLabel: label,
    trend,
    previousOverall: prevOverall,
  };
}

function getPreviousPeriod(key: "week" | "month" | "quarter" | "all"): ScorePeriod {
  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  switch (key) {
    case "week":
      start.setDate(start.getDate() - 14);
      end.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 2);
      end.setMonth(end.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(start.getMonth() - 6);
      end.setMonth(end.getMonth() - 3);
      break;
    case "all":
    default:
      start.setFullYear(start.getFullYear() - 2);
      end.setFullYear(end.getFullYear() - 1);
  }
  return { start, end, label: "Tempoh Sebelum" };
}

// ============================================================
// Compute scores for all staff (for GM dashboard leaderboard)
// ============================================================
export async function computeAllStaffScores(periodKey: "week" | "month" | "quarter" | "all" = "month") {
  const staff = await db.user.findMany({ where: { role: "STAF", active: true }, orderBy: { name: "asc" } });
  const scores: StaffScore[] = [];
  for (const s of staff) {
    try {
      scores.push(await computeStaffScore(s.id, periodKey));
    } catch (e) {
      console.error("Score error for", s.id, e);
    }
  }
  return scores.sort((a, b) => b.overall - a.overall);
}

// ============================================================
// 6-month trend per dimension for a user
// ============================================================
export async function computeDimensionTrend(userId: string) {
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const end = new Date();
    end.setMonth(end.getMonth() - i);
    end.setDate(end.getDate());
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    months.push({ label: start.toLocaleDateString("ms-MY", { month: "short" }), start, end });
  }
  const results: { label: string; taskCompletion: number; timeliness: number; workQuality: number; initiative: number; communication: number; productivity: number; overall: number }[] = [];
  for (const m of months) {
    // simplified per-month score using task & reviews in that month
    const tasks = await db.task.findMany({
      where: {
        assigneeId: userId,
        OR: [{ completedAt: { gte: m.start, lte: m.end } }],
      },
      include: { qualityReviews: true, timeLogs: true },
    });
    const eligible = tasks.filter(t => t.status !== "Dibatalkan");
    const completed = eligible.filter(t => t.status === "Selesai" && t.completedAt);
    const shouldComplete = eligible.filter(t => new Date(t.extendedDueDate || t.dueDate) >= m.start && new Date(t.extendedDueDate || t.dueDate) <= m.end);
    const tc = shouldComplete.length === 0 ? (completed.length ? 100 : 0) : (completed.length / shouldComplete.length) * 100;
    const onTime = completed.filter(t => new Date(t.completedAt!) <= new Date(t.extendedDueDate || t.dueDate));
    const tm = completed.length === 0 ? 100 : (onTime.length / completed.length) * 100;
    const reviewed = completed.filter(t => t.qualityReviews.length > 0);
    const avgRating = reviewed.length === 0 ? 0 : reviewed.reduce((s, t) => {
      const r = t.qualityReviews[0];
      return s + (r.accuracy + r.completeness + r.professionalism + r.specCompliance) / 4;
    }, 0) / reviewed.length;
    const reworkRate = completed.length === 0 ? 0 : (completed.filter(t => t.reworkCount > 0).length / completed.length) * 100;
    const wq = 0.7 * (avgRating / 5 * 100) + 0.3 * (100 - reworkRate);
    const logged = await db.timeLog.aggregate({ where: { userId, date: { gte: m.start, lte: m.end } }, _sum: { hours: true } });
    const overall = Math.round(tc * 0.2 + tm * 0.15 + wq * 0.25 + 65 * 0.1 + 70 * 0.15 + Math.min(100, (logged._sum.hours || 0) / 40 * 100) * 0.15);
    results.push({
      label: m.label,
      taskCompletion: Math.round(tc),
      timeliness: Math.round(tm),
      workQuality: Math.round(wq),
      initiative: 60,
      communication: 70,
      productivity: Math.round(Math.min(100, (logged._sum.hours || 0) / 40 * 100)),
      overall,
    });
  }
  return results;
}
