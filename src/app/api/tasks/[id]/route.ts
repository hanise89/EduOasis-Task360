import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

function taskToApi(t: any) {
  return {
    id: t.id, title: t.title, description: t.description, assigneeId: t.assigneeId,
    createdById: t.createdById, category: t.category, priority: t.priority, status: t.status,
    progress: t.progress, complexity: t.complexity, estimatedHours: t.estimatedHours,
    startDate: t.startDate.toISOString(), dueDate: t.dueDate.toISOString(),
    completedAt: t.completedAt?.toISOString() || null,
    extendedDueDate: t.extendedDueDate?.toISOString() || null,
    reworkCount: t.reworkCount, links: JSON.parse(t.linksJson || "[]"), isPersonal: t.isPersonal,
    createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, role: t.assignee.role, position: t.assignee.position, avatarColor: t.assignee.avatarColor, email: t.assignee.email, weeklyHours: t.assignee.weeklyHours, startDate: t.assignee.startDate.toISOString(), active: t.assignee.active } : undefined,
    createdBy: t.createdBy ? { id: t.createdBy.id, name: t.createdBy.name } : undefined,
    timeLogs: t.timeLogs?.map((tl: any) => ({ id: tl.id, taskId: tl.taskId, userId: tl.userId, date: tl.date.toISOString(), hours: tl.hours, note: tl.note })) || [],
    qualityReviews: t.qualityReviews?.map((r: any) => ({ id: r.id, taskId: r.taskId, reviewerId: r.reviewerId, accuracy: r.accuracy, completeness: r.completeness, professionalism: r.professionalism, specCompliance: r.specCompliance, comment: r.comment, createdAt: r.createdAt.toISOString() })) || [],
    comments: t.comments?.map((c: any) => ({ id: c.id, taskId: c.taskId, authorId: c.authorId, body: c.body, replyToId: c.replyToId, isFromGM: c.isFromGM, createdAt: c.createdAt.toISOString(), author: c.author ? { id: c.author.id, name: c.author.name, role: c.author.role, avatarColor: c.author.avatarColor } : undefined })) || [],
    blockers: t.blockers?.map((b: any) => ({ id: b.id, taskId: b.taskId, reportedById: b.reportedById, type: b.type, description: b.description, helpNeeded: b.helpNeeded, status: b.status, reportedAt: b.reportedAt.toISOString(), resolvedAt: b.resolvedAt?.toISOString() || null })) || [],
    extensionRequests: t.extensionRequests?.map((e: any) => ({ id: e.id, taskId: e.taskId, requestedDate: e.requestedDate.toISOString(), reason: e.reason, status: e.status, createdAt: e.createdAt.toISOString() })) || [],
    history: (t.history || []).map((h: any) => ({ id: h.id, taskId: h.taskId, actorId: h.actorId, field: h.field, oldValue: h.oldValue, newValue: h.newValue, note: h.note, createdAt: h.createdAt.toISOString() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  };
}

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { id } = await params;
  const task = await db.task.findUnique({
    where: { id },
    include: {
      assignee: true, createdBy: true, timeLogs: true, qualityReviews: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      blockers: { orderBy: { reportedAt: "desc" } },
      extensionRequests: { orderBy: { createdAt: "desc" } },
      taskHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!task) return NextResponse.json({ error: "Tugasan tidak dijumpai." }, { status: 404 });
  if (user.role === "STAF" && task.assigneeId !== user.id) {
    return NextResponse.json({ error: "Anda tiada akses kepada tugasan ini." }, { status: 403 });
  }
  return NextResponse.json({ task: { ...taskToApi({ ...task, history: task.taskHistory }) } });
});

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
  const allowed: any = {};
  const fields = ["title", "description", "category", "priority", "complexity", "estimatedHours", "progress"];
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }
  if (body.startDate) allowed.startDate = new Date(body.startDate);
  if (body.dueDate) allowed.dueDate = new Date(body.dueDate);
  if (body.links) allowed.linksJson = JSON.stringify(body.links);
  const updated = await db.task.update({ where: { id }, data: allowed, include: { assignee: true, createdBy: true } });
  await db.taskHistory.create({
    data: { taskId: id, actorId: user.id, field: "update", note: "Tugasan dikemas kini" },
  });
  await db.auditLog.create({
    data: { actorId: user.id, action: "UPDATE_TASK", entity: "task", entityId: id, detail: Object.keys(allowed).join(", ") },
  });
  return NextResponse.json({ task: taskToApi(updated) });
});

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM boleh memadam." }, { status: 403 });
  const { id } = await params;
  await db.task.delete({ where: { id } });
  await db.auditLog.create({
    data: { actorId: user.id, action: "DELETE_TASK", entity: "task", entityId: id, detail: "Tugasan dipadam" },
  });
  return NextResponse.json({ ok: true });
});
