import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Tugasan tidak dijumpai." }, { status: 404 });
  if (user.role !== "GM" && task.assigneeId !== user.id) {
    return NextResponse.json({ error: "Anda tiada akses." }, { status: 403 });
  }
  const body = await req.json();
  const comment = await db.comment.create({
    data: {
      taskId: id, authorId: user.id, body: String(body.body || ""),
      isFromGM: user.role === "GM",
    },
    include: { author: true },
  });
  // Notify the other party
  const notifyTo = user.role === "GM" ? task.assigneeId : task.createdById;
  if (notifyTo !== user.id) {
    await db.notification.create({
      data: { userId: notifyTo, type: "comment_new", title: "Komen Baharu", message: `${user.name}: ${body.body?.slice(0, 60) || ""}`, link: `?view=tasks&id=${id}` },
    });
  }
  return NextResponse.json({
    comment: {
      id: comment.id, taskId: comment.taskId, authorId: comment.authorId, body: comment.body,
      replyToId: comment.replyToId, isFromGM: comment.isFromGM,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author ? { id: comment.author.id, name: comment.author.name, role: comment.author.role, avatarColor: comment.author.avatarColor } : undefined,
    },
  });
}
