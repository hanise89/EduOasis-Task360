import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const POINTS: Record<string, number> = { Kecil: 5, Sederhana: 10, Besar: 20 };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM boleh mengesahkan." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { status, impactLevel, gmComment } = body;
  const points = status === "Disahkan" ? (POINTS[impactLevel] || 5) : 0;
  const updated = await db.initiative.update({
    where: { id },
    data: { status, impactLevel, points, gmComment: gmComment || "", verifiedAt: status !== "Dihantar" ? new Date() : null },
    include: { user: true },
  });
  await db.auditLog.create({
    data: { actorId: user.id, action: "VERIFY_INITIATIVE", entity: "initiative", entityId: id, detail: `${status} (${impactLevel}, ${points} pts)` },
  });
  if (status === "Disahkan") {
    await db.notification.create({
      data: { userId: updated.userId, type: "initiative_verified", title: "Inisiatif Disahkan", message: `"${updated.title}" disahkan (${points} mata).`, link: "?view=initiatives" },
    });
  }
  return NextResponse.json({
    initiative: {
      id: updated.id, userId: updated.userId, title: updated.title, problem: updated.problem, action: updated.action, outcome: updated.outcome,
      evidenceLinks: JSON.parse(updated.evidenceJson || "[]"), impactLevel: updated.impactLevel, points: updated.points,
      status: updated.status, submittedAt: updated.submittedAt.toISOString(), verifiedAt: updated.verifiedAt?.toISOString() || null,
      gmComment: updated.gmComment,
    },
  });
}
