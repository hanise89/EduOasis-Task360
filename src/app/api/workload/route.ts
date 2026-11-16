import { NextRequest, NextResponse } from "next/server";
import { getWorkloadForAllStaff } from "@/lib/workload";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const weeksAhead = Number(searchParams.get("weeksAhead") || 0);
  const workloads = await getWorkloadForAllStaff(weeksAhead);
  return NextResponse.json({ workloads });
});
