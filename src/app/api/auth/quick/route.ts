import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  let role: string;
  try {
    const body = await req.json();
    role = String(body.role || "STAF").toUpperCase();
  } catch {
    role = "STAF";
  }

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
});
