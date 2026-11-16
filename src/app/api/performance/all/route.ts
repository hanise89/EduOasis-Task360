import { NextRequest, NextResponse } from "next/server";
import { computeAllStaffScores } from "@/lib/scoring";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "month") as "week" | "month" | "quarter" | "all";
  const scores = await computeAllStaffScores(period);
  return NextResponse.json({ scores });
});
