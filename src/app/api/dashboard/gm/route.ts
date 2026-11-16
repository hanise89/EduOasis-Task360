import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { computeAllStaffScores } from "@/lib/scoring";
import { getWorkloadForAllStaff } from "@/lib/workload";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "month") as "week" | "month" | "quarter" | "all";

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const allTasks = await db.task.findMany({
    where: { status: { not: "Dibatalkan" } },
    include: { assignee: true },
  });
  const active = allTasks.filter(t => ["Belum Mula", "Dalam Proses", "Menunggu Semakan", "Disekat"].includes(t.status));
  const overdue = allTasks.filter(t => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    return t.status !== "Selesai" && due < now;
  });
  const completedThisWeek = allTasks.filter(t => t.status === "Selesai" && t.completedAt && new Date(t.completedAt) >= weekStart);

  const scores = await computeAllStaffScores(period);
  const avgScore = scores.length ? Math.round(scores.reduce((s, x) => s + x.overall, 0) / scores.length) : 0;

  const workloads = await getWorkloadForAllStaff(0);
  const overloaded = workloads.filter(w => w.status === "Beban Berlebihan" || w.status === "Tinggi");

  // Needs attention: overdue tasks, open blockers, overloaded staff
  const openBlockers = await db.blocker.findMany({
    where: { status: "Terbuka" },
    include: { task: { include: { assignee: true } } },
    orderBy: { reportedAt: "desc" },
  });
  const upcomingDeadlines = allTasks.filter(t => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return t.status !== "Selesai" && t.status !== "Dibatalkan" && days >= -1 && days <= 3;
  });

  return NextResponse.json({
    kpis: {
      active: active.length,
      overdue: overdue.length,
      completedThisWeek: completedThisWeek.length,
      avgScore,
      totalStaff: scores.length,
      overloadedStaff: overloaded.length,
    },
    scores,
    workloads,
    attention: {
      overdueTasks: overdue.slice(0, 10).map(t => ({
        id: t.id, title: t.title, dueDate: (t.extendedDueDate || t.dueDate).toISOString(),
        assigneeName: t.assignee?.name || "", assigneeColor: t.assignee?.avatarColor || "",
        priority: t.priority,
      })),
      openBlockers: openBlockers.map(b => ({
        id: b.id, type: b.type, description: b.description, helpNeeded: b.helpNeeded,
        reportedAt: b.reportedAt.toISOString(),
        taskTitle: b.task?.title || "", taskId: b.taskId,
        assigneeName: b.task?.assignee?.name || "",
      })),
      upcomingDeadlines: upcomingDeadlines.slice(0, 10).map(t => ({
        id: t.id, title: t.title, dueDate: (t.extendedDueDate || t.dueDate).toISOString(),
        assigneeName: t.assignee?.name || "", priority: t.priority,
      })),
      overloadedStaff: overloaded.map(w => ({ userId: w.userId, userName: w.userName, status: w.status, utilisation: w.utilisation, activeTasks: w.activeTasks })),
    },
  });
});
