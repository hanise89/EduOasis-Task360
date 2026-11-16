import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { role } = await req.json();
  const where = role === "GM" ? { role: "GM" } : { role: "STAF", active: true };
  const user = await db.user.findFirst({ where, orderBy: { name: "asc" } });
  if (!user) {
    return NextResponse.json({ error: "Pengguna demo tidak dijumpai." }, { status: 404 });
  }
  const res = NextResponse.json({
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role,
      position: user.position, weeklyHours: user.weeklyHours, avatarColor: user.avatarColor,
      startDate: user.startDate.toISOString(), active: user.active,
    },
  });
  res.cookies.set("task360_session", user.id, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
