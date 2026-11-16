import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM." }, { status: 403 });
  const logs = await db.auditLog.findMany({
    include: { actor: true },
    orderBy: { timestamp: "desc" },
    take: 100,
  });
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id, actorId: l.actorId, actorName: l.actor?.name || "", action: l.action,
      entity: l.entity, entityId: l.entityId, detail: l.detail, timestamp: l.timestamp.toISOString(),
    })),
  });
});
