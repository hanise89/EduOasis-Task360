import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { computeStaffScore } from "@/lib/scoring";
import { getWorkloadForUser } from "@/lib/workload";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "month") as "week" | "month" | "quarter" | "all";
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endToday = new Date(today);
  endToday.setHours(23, 59, 59, 999);

  const tasks = await db.task.findMany({
    where: { assigneeId: user.id, status: { not: "Dibatalkan" } },
    include: { comments: { where: { isFromGM: true }, orderBy: { createdAt: "desc" }, take: 1, include: { author: true } } },
    orderBy: { dueDate: "asc" },
  });
  const overdue = tasks.filter(t => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    return t.status !== "Selesai" && due < now;
  });
  const todayTasks = tasks.filter(t => {
    const due = new Date(t.extendedDueDate || t.dueDate);
    return t.status !== "Selesai" && due >= today && due <= endToday;
  });
  const inProgress = tasks.filter(t => ["Dalam Proses", "Menunggu Semakan"].includes(t.status));
  const pendingReview = tasks.filter(t => t.status === "Menunggu Semakan");

  const score = await computeStaffScore(user.id, period);
  const workload = await getWorkloadForUser(user.id);

  const initiatives = await db.initiative.findMany({
    where: { userId: user.id }, orderBy: { submittedAt: "desc" }, take: 3,
  });
  const recentFeedback = tasks
    .filter(t => t.comments.length > 0)
    .map(t => ({ taskId: t.id, title: t.title, comment: t.comments[0].body, createdAt: t.comments[0].createdAt.toISOString(), authorName: t.comments[0].author?.name || "" }))
    .slice(0, 3);

  return NextResponse.json({
    kpis: {
      today: todayTasks.length,
      overdue: overdue.length,
      inProgress: inProgress.length,
      pendingReview: pendingReview.length,
      overallScore: score.overall,
      grade: score.grade,
      workloadStatus: workload.status,
    },
    todayTasks: todayTasks.map(t => ({ id: t.id, title: t.title, dueDate: (t.extendedDueDate || t.dueDate).toISOString(), priority: t.priority, progress: t.progress, status: t.status })),
    overdueTasks: overdue.slice(0, 5).map(t => ({ id: t.id, title: t.title, dueDate: (t.extendedDueDate || t.dueDate).toISOString(), priority: t.priority })),
    score,
    workload,
    initiatives: initiatives.map(i => ({ id: i.id, title: i.title, status: i.status, impactLevel: i.impactLevel, points: i.points })),
    recentFeedback,
  });
});
