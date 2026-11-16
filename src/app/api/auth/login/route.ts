import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await db.user.findUnique({ where: { email: String(email || "").toLowerCase() } });
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "E-mel atau kata laluan tidak sah." }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json({ error: "Akaun tidak aktif." }, { status: 403 });
  }
  const res = NextResponse.json({
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role,
      position: user.position, weeklyHours: user.weeklyHours, avatarColor: user.avatarColor,
      startDate: user.startDate.toISOString(), active: user.active,
    },
  });
  res.cookies.set("task360_session", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
