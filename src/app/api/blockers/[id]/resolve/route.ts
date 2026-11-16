import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { id } = await params;
  const blocker = await db.blocker.findUnique({ where: { id }, include: { task: true } });
  if (!blocker) return NextResponse.json({ error: "Halangan tidak dijumpai." }, { status: 404 });
  if (user.role !== "GM" && blocker.reportedById !== user.id && blocker.task.assigneeId !== user.id) {
    return NextResponse.json({ error: "Anda tiada akses." }, { status: 403 });
  }
  const updated = await db.blocker.update({ where: { id }, data: { status: "Selesai", resolvedAt: new Date() } });
  // If task was Disekat, move back to Dalam Proses
  if (blocker.task.status === "Disekat") {
    await db.task.update({ where: { id: blocker.taskId }, data: { status: "Dalam Proses" } });
  }
  return NextResponse.json({ blocker: { ...updated, reportedAt: updated.reportedAt.toISOString(), resolvedAt: updated.resolvedAt?.toISOString() || null } });
});
