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
  const ext = await db.extensionRequest.create({
    data: { taskId: id, requestedDate: new Date(body.requestedDate), reason: body.reason || "", status: "Menunggu" },
  });
  await db.notification.create({
    data: { userId: task.createdById, type: "extension_request", title: "Permintaan Lanjutan Tarikh", message: body.reason?.slice(0, 80) || "", link: `?view=tasks&id=${id}` },
  });
  return NextResponse.json({ extension: { ...ext, requestedDate: ext.requestedDate.toISOString(), createdAt: ext.createdAt.toISOString() } });
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM boleh meluluskan." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const ext = await db.extensionRequest.findUnique({ where: { id: body.extensionId } });
  if (!ext || ext.taskId !== id) return NextResponse.json({ error: "Permintaan tidak dijumpai." }, { status: 404 });
  const updated = await db.extensionRequest.update({ where: { id: body.extensionId }, data: { status: body.status } });
  if (body.status === "Diluluskan") {
    await db.task.update({ where: { id }, data: { extendedDueDate: ext.requestedDate } });
    await db.taskHistory.create({ data: { taskId: id, actorId: user.id, field: "extension", newValue: "Diluluskan", note: `Tarikh dilanjutkan ke ${new Date(ext.requestedDate).toLocaleDateString("ms-MY")}` } });
    await db.notification.create({
      data: { userId: (await db.task.findUnique({ where: { id } }))!.assigneeId, type: "extension_request", title: "Lanjutan Tarikh Diluluskan", message: `Tarikh akhir telah dilanjutkan.`, link: `?view=tasks&id=${id}` },
    });
  }
  return NextResponse.json({ extension: { ...updated, requestedDate: updated.requestedDate.toISOString(), createdAt: updated.createdAt.toISOString() } });
});
