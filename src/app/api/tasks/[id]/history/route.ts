import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { id } = await params;
  const history = await db.taskHistory.findMany({ where: { taskId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ history: history.map(h => ({ ...h, createdAt: h.createdAt.toISOString() })) });
});
