import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const where = user.role === "GM" ? {} : { id: user.id };
  const users = await db.user.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id, email: u.email, name: u.name, role: u.role, position: u.position,
      weeklyHours: u.weeklyHours, avatarColor: u.avatarColor,
      startDate: u.startDate.toISOString(), active: u.active,
    })),
  });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM boleh edit profil." }, { status: 403 });
  const body = await req.json();
  const { id, ...data } = body;
  const updated = await db.user.update({ where: { id }, data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined } });
  await db.auditLog.create({
    data: { actorId: user.id, action: "UPDATE_USER", entity: "user", entityId: id, detail: Object.keys(data).join(", ") },
  });
  return NextResponse.json({ user: { id: updated.id, name: updated.name, position: updated.position, weeklyHours: updated.weeklyHours, avatarColor: updated.avatarColor, startDate: updated.startDate.toISOString() } });
});
