import { NextRequest, NextResponse } from "next/server";
import { computeDimensionTrend } from "@/lib/scoring";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  const { userId } = await params;
  if (user.role === "STAF" && user.id !== userId) {
    return NextResponse.json({ error: "Anda hanya boleh lihat skor sendiri." }, { status: 403 });
  }
  const trend = await computeDimensionTrend(userId);
  return NextResponse.json({ trend });
}
