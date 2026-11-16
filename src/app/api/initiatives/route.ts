import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const POINTS: Record<string, number> = { Kecil: 5, Sederhana: 10, Besar: 20 };

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: any = {};
  if (user.role === "STAF") where.userId = user.id;
  if (status && status !== "all") where.status = status;
  const initiatives = await db.initiative.findMany({ where, include: { user: true }, orderBy: { submittedAt: "desc" } });
  return NextResponse.json({
    initiatives: initiatives.map((i) => ({
      id: i.id, userId: i.userId, title: i.title, problem: i.problem, action: i.action, outcome: i.outcome,
      evidenceLinks: JSON.parse(i.evidenceJson || "[]"), impactLevel: i.impactLevel, points: i.points,
      status: i.status, submittedAt: i.submittedAt.toISOString(), verifiedAt: i.verifiedAt?.toISOString() || null,
      gmComment: i.gmComment,
      user: i.user ? { id: i.user.id, name: i.user.name, position: i.user.position, avatarColor: i.user.avatarColor } : undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const body = await req.json();
  const init = await db.initiative.create({
    data: {
      userId: user.id, title: body.title, problem: body.problem || "", action: body.action || "",
      outcome: body.outcome || "", evidenceJson: JSON.stringify(body.evidenceLinks || []),
      impactLevel: "Kecil", points: 0, status: "Dihantar",
    },
    include: { user: true },
  });
  await db.notification.create({
    data: { userId: (await db.user.findFirst({ where: { role: "GM" } }))!.id, type: "initiative_submitted", title: "Inisiatif Baru Diserahkan", message: `${user.name}: ${body.title}`, link: "?view=initiatives" },
  });
  return NextResponse.json({
    initiative: {
      id: init.id, userId: init.userId, title: init.title, problem: init.problem, action: init.action, outcome: init.outcome,
      evidenceLinks: JSON.parse(init.evidenceJson || "[]"), impactLevel: init.impactLevel, points: init.points,
      status: init.status, submittedAt: init.submittedAt.toISOString(), verifiedAt: init.verifiedAt?.toISOString() || null,
      gmComment: init.gmComment, user: { id: init.user!.id, name: init.user!.name, position: init.user!.position, avatarColor: init.user!.avatarColor },
    },
  });
}
