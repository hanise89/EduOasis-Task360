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
  const log = await db.timeLog.create({
    data: { taskId: id, userId: user.id, date: new Date(body.date || Date.now()), hours: Number(body.hours) || 0, note: body.note || "" },
  });
  return NextResponse.json({ log: { ...log, date: log.date.toISOString() } });
});

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { id } = await params;
  const logs = await db.timeLog.findMany({ where: { taskId: id }, orderBy: { date: "desc" } });
  return NextResponse.json({ logs: logs.map(l => ({ ...l, date: l.date.toISOString() })) });
});
