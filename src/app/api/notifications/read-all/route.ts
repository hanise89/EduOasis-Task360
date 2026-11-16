import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
});
