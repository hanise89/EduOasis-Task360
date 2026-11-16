import { NextResponse } from "next/server";
import { getWorkloadHeatmap } from "@/lib/workload";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM." }, { status: 403 });
  const heatmap = await getWorkloadHeatmap();
  return NextResponse.json({ heatmap });
});
