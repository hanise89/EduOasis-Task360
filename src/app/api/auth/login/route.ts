import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  let email: string;
  let password: string;
  try {
    const body = await req.json();
    email = String(body.email || "").toLowerCase().trim();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak sah." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "E-mel dan kata laluan diperlukan." }, { status: 400 });
  }

  let user;
  try {
    user = await db.user.findUnique({ where: { email } });
  } catch (e: any) {
    console.error("[auth/login] Database error:", e?.message || e);
    return NextResponse.json(
      { error: "Pelayan pangkalan data tidak boleh dihubungi. Sila cuba lagi sebentar." },
      { status: 503 }
    );
  }

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
