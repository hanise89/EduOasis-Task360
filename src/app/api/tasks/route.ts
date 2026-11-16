import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");
  const period = searchParams.get("period");

  const where: any = {};
  if (user.role === "STAF") {
    where.assigneeId = user.id;
  } else if (assigneeId && assigneeId !== "all") {
    where.assigneeId = assigneeId;
  }
  if (status && status !== "all") where.status = status;
  if (category && category !== "all") where.category = category;
  if (priority && priority !== "all") where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (period && period !== "all") {
    const now = new Date();
    let start = new Date();
    if (period === "week") start.setDate(start.getDate() - 7);
    else if (period === "month") start.setMonth(start.getMonth() - 1);
    else if (period === "quarter") start.setMonth(start.getMonth() - 3);
    where.OR = [
      ...(where.OR || []),
      { dueDate: { gte: start, lte: now } },
      { completedAt: { gte: start, lte: now } },
    ];
  }

  const tasks = await db.task.findMany({
    where,
    include: {
      assignee: true, createdBy: true, timeLogs: true, qualityReviews: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      blockers: { orderBy: { reportedAt: "desc" } },
      extensionRequests: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tasks: tasks.map(taskToApi) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const body = await req.json();
  const isPersonal = body.isPersonal === true;
  // Staff can only create personal tasks; GM can create any
  if (user.role !== "GM" && !isPersonal) {
    return NextResponse.json({ error: "Hanya GM boleh menugaskan tugasan kepada staf." }, { status: 403 });
  }
  const assigneeId = isPersonal && user.role !== "GM" ? user.id : body.assigneeId;
  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description || "",
      assigneeId,
      createdById: user.id,
      category: body.category || "Lain",
      priority: body.priority || "Sederhana",
      status: body.status || "Belum Mula",
      progress: body.progress || 0,
      complexity: body.complexity || 1,
      estimatedHours: body.estimatedHours || 0,
      startDate: new Date(body.startDate || Date.now()),
      dueDate: new Date(body.dueDate),
      linksJson: JSON.stringify(body.links || []),
      isPersonal,
    },
    include: { assignee: true, createdBy: true },
  });
  await db.taskHistory.create({
    data: { taskId: task.id, actorId: user.id, field: "created", newValue: task.title, note: "Tugasan dicipta" },
  });
  await db.auditLog.create({
    data: { actorId: user.id, action: "CREATE_TASK", entity: "task", entityId: task.id, detail: task.title },
  });
  // Notify assignee
  if (assigneeId !== user.id) {
    await db.notification.create({
      data: { userId: assigneeId, type: "task_assigned", title: "Tugasan Baharu", message: `Anda ditugaskan: ${task.title}`, link: `?view=tasks&id=${task.id}` },
    });
  }
  return NextResponse.json({ task: taskToApi(task) });
}
