import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Tugasan tidak dijumpai." }, { status: 404 });
  if (user.role !== "GM" && task.assigneeId !== user.id) {
    return NextResponse.json({ error: "Anda tiada akses." }, { status: 403 });
  }
  const body = await req.json();
  const blocker = await db.blocker.create({
    data: {
      taskId: id, reportedById: user.id,
      type: body.type || "Lain", description: body.description || "",
      helpNeeded: body.helpNeeded || "", status: "Terbuka",
    },
  });
  // Set task Disekat
  await db.task.update({ where: { id }, data: { status: "Disekat" } });
  await db.taskHistory.create({
    data: { taskId: id, actorId: user.id, field: "blocker", newValue: body.description, note: `Halangan dilaporkan: ${body.type}` },
  });
  await db.notification.create({
    data: { userId: task.createdById, type: "blocker_reported", title: "Halangan Dilaporkan", message: body.description?.slice(0, 80) || "", link: `?view=tasks&id=${id}` },
  });
  return NextResponse.json({
    blocker: { ...blocker, reportedAt: blocker.reportedAt.toISOString(), resolvedAt: blocker.resolvedAt?.toISOString() || null },
  });
});
