import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id, userId: n.userId, type: n.type, title: n.title, message: n.message,
      link: n.link, read: n.read, createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: await db.notification.count({ where: { userId: user.id, read: false } }),
  });
});
