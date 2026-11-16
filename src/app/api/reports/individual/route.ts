import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { computeStaffScore } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || user.id;
  const period = (searchParams.get("period") || "month") as "week" | "month" | "quarter" | "all";
  if (user.role === "STAF" && userId !== user.id) {
    return NextResponse.json({ error: "Anda hanya boleh eksport laporan sendiri." }, { status: 403 });
  }
  const score = await computeStaffScore(userId, period);
  const tasks = await db.task.findMany({
    where: { assigneeId: userId, status: { not: "Dibatalkan" } },
    include: { qualityReviews: true, timeLogs: true, blockers: true },
    orderBy: { createdAt: "desc" },
  });
  const initiatives = await db.initiative.findMany({ where: { userId, status: "Disahkan" }, orderBy: { verifiedAt: "desc" } });
  const accRatings = await db.accountabilityRating.findMany({ where: { userId }, orderBy: { period: "desc" }, take: 3 });

  return NextResponse.json({
    score,
    tasks: tasks.map(t => ({
      id: t.id, title: t.title, category: t.category, priority: t.priority, status: t.status,
      dueDate: (t.extendedDueDate || t.dueDate).toISOString(),
      completedAt: t.completedAt?.toISOString() || null,
      estimatedHours: t.estimatedHours, reworkCount: t.reworkCount,
      rating: t.qualityReviews[0] ? (t.qualityReviews[0].accuracy + t.qualityReviews[0].completeness + t.qualityReviews[0].professionalism + t.qualityReviews[0].specCompliance) / 4 : null,
    })),
    initiatives: initiatives.map(i => ({ id: i.id, title: i.title, impactLevel: i.impactLevel, points: i.points, verifiedAt: i.verifiedAt?.toISOString() || null })),
    accountabilityRatings: accRatings.map(a => ({ period: a.period, rating: a.rating, comment: a.comment })),
  });
}
