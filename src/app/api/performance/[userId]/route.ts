import { NextRequest, NextResponse } from "next/server";
import { computeStaffScore, computeDimensionTrend } from "@/lib/scoring";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ userId: string }> }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { userId } = await params;
  // Staff can only view own
  if (user.role === "STAF" && user.id !== userId) {
    return NextResponse.json({ error: "Anda hanya boleh lihat skor sendiri." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "month") as "week" | "month" | "quarter" | "all";
  const score = await computeStaffScore(userId, period);
  const trend = await computeDimensionTrend(userId);
  return NextResponse.json({ score, trend });
});
