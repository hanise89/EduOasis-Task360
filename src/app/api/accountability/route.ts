import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const userId = user.role === "GM" ? (searchParams.get("userId") || undefined) : user.id;
  const where = userId ? { userId } : {};
  const ratings = await db.accountabilityRating.findMany({ where, include: { user: true }, orderBy: { period: "desc" } });
  return NextResponse.json({
    ratings: ratings.map((r) => ({
      id: r.id, userId: r.userId, period: r.period, rating: r.rating, comment: r.comment,
      user: r.user ? { id: r.user.id, name: r.user.name, position: r.user.position, avatarColor: r.user.avatarColor } : undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM boleh menilai." }, { status: 403 });
  const body = await req.json();
  const period = body.period || new Date().toISOString().slice(0, 7);
  const rating = await db.accountabilityRating.upsert({
    where: { userId_period: { userId: body.userId, period } },
    update: { rating: body.rating, comment: body.comment || "" },
    create: { userId: body.userId, period, rating: body.rating, comment: body.comment || "" },
  });
  await db.auditLog.create({
    data: { actorId: user.id, action: "ACCOUNTABILITY_RATING", entity: "user", entityId: body.userId, detail: `${period}: ${body.rating}/5` },
  });
  await db.notification.create({
    data: { userId: body.userId, type: "accountability_rated", title: "Rating Akauntabiliti Diterima", message: `Penilaian ${period}: ${body.rating}/5`, link: "?view=performance" },
  });
  return NextResponse.json({ rating });
}
