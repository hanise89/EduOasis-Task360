import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { computeAllStaffScores } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "month") as "week" | "month" | "quarter" | "all";
  const scores = await computeAllStaffScores(period);
  const staff = await db.user.findMany({ where: { role: "STAF", active: true }, orderBy: { name: "asc" } });
  const taskCounts = await Promise.all(staff.map(async (s) => {
    const tasks = await db.task.findMany({ where: { assigneeId: s.id, status: { not: "Dibatalkan" } } });
    const completed = tasks.filter(t => t.status === "Selesai").length;
    const overdue = tasks.filter(t => t.status !== "Selesai" && new Date(t.extendedDueDate || t.dueDate) < new Date()).length;
    const active = tasks.filter(t => ["Dalam Proses", "Menunggu Semakan", "Disekat"].includes(t.status)).length;
    return { userId: s.id, completed, overdue, active, total: tasks.length };
  }));
  return NextResponse.json({
    scores,
    staff: staff.map(s => ({
      id: s.id, name: s.name, position: s.position, avatarColor: s.avatarColor,
      tasks: taskCounts.find(t => t.userId === s.id),
    })),
  });
}
