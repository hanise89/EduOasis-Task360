import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM boleh menilai." }, { status: 403 });
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Tugasan tidak dijumpai." }, { status: 404 });
  const body = await req.json();
  const review = await db.qualityReview.create({
    data: {
      taskId: id, reviewerId: user.id,
      accuracy: body.accuracy, completeness: body.completeness,
      professionalism: body.professionalism, specCompliance: body.specCompliance,
      comment: body.comment || "",
    },
  });
  // Mark task complete
  await db.task.update({ where: { id }, data: { status: "Selesai", completedAt: new Date(), progress: 100 } });
  await db.taskHistory.create({
    data: { taskId: id, actorId: user.id, field: "review", newValue: "Selesai & Dinilai", note: `Rating: ${((body.accuracy + body.completeness + body.professionalism + body.specCompliance) / 4).toFixed(1)}/5` },
  });
  await db.auditLog.create({
    data: { actorId: user.id, action: "QUALITY_REVIEW", entity: "task", entityId: id, detail: `Penilaian: ${body.accuracy}/${body.completeness}/${body.professionalism}/${body.specCompliance}` },
  });
  await db.notification.create({
    data: { userId: task.assigneeId, type: "quality_reviewed", title: "Penilaian Kualiti Diterima", message: `"${task.title}" telah dinilai.`, link: `?view=tasks&id=${id}` },
  });
  return NextResponse.json({ review });
});
