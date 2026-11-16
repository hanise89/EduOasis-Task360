import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Tugasan tidak dijumpai." }, { status: 404 });
  if (user.role !== "GM" && task.assigneeId !== user.id) {
    return NextResponse.json({ error: "Anda tiada akses." }, { status: 403 });
  }
  const body = await req.json();
  const { status, progress } = body;
  const oldStatus = task.status;
  const data: any = {};
  if (status) data.status = status;
  if (progress !== undefined) data.progress = progress;
  if (status === "Selesai") {
    data.completedAt = new Date();
    data.progress = 100;
  } else if (status === "Dalam Proses" && task.status === "Belum Mula") {
    // ok
  }
  const updated = await db.task.update({ where: { id }, data });
  await db.taskHistory.create({
    data: { taskId: id, actorId: user.id, field: "status", oldValue: oldStatus, newValue: status || String(progress ?? ""), note: status ? `Status ditukar ke ${status}` : `Kemajuan ${progress}%` },
  });
  // Notify GM when staff submits for review
  if (status === "Menunggu Semakan" && user.role !== "GM") {
    await db.notification.create({
      data: { userId: task.createdById, type: "task_review", title: "Tugasan untuk Semakan", message: `"${task.title}" menunggu semakan.`, link: `?view=tasks&id=${id}` },
    });
  }
  // Notify staff when returned
  if (status === "Dalam Proses" && oldStatus === "Menunggu Semakan") {
    await db.task.update({ where: { id }, data: { reworkCount: { increment: 1 } } });
    await db.notification.create({
      data: { userId: task.assigneeId, type: "task_returned", title: "Tugasan Dipulangkan", message: `"${task.title}" dipulangkan untuk semakan semula.`, link: `?view=tasks&id=${id}` },
    });
  }
  return NextResponse.json({ task: updated });
});
