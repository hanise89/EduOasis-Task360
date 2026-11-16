import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM." }, { status: 403 });
  const s = await db.setting.findUnique({ where: { id: "singleton" } });
  if (!s) {
    return NextResponse.json({
      settings: {
        weights: { taskCompletion: 20, timeliness: 15, workQuality: 25, initiative: 10, communication: 15, productivity: 15 },
        initiativeTargetMonthly: 20, initiativeTargetQuarterly: 60,
        gradeBands: { A: { min: 90, max: 100 }, B: { min: 75, max: 89 }, C: { min: 60, max: 74 }, D: { min: 40, max: 59 }, E: { min: 0, max: 39 } },
        workingDays: [1, 2, 3, 4, 5], holidays: [],
      },
    });
  }
  return NextResponse.json({
    settings: {
      weights: JSON.parse(s.weightsJson),
      initiativeTargetMonthly: s.initiativeTargetMonthly,
      initiativeTargetQuarterly: s.initiativeTargetQuarterly,
      gradeBands: JSON.parse(s.gradeBandsJson),
      workingDays: JSON.parse(s.workingDaysJson),
      holidays: JSON.parse(s.holidaysJson),
    },
  });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM." }, { status: 403 });
  const body = await req.json();
  const weights = body.weights;
  const total = Object.values(weights).reduce((a: number, b: any) => a + Number(b), 0);
  if (Math.abs(total - 100) > 0.5) {
    return NextResponse.json({ error: `Jumlah pemberat mesti 100%. Kini ${total}%.` }, { status: 400 });
  }
  const updated = await db.setting.upsert({
    where: { id: "singleton" },
    update: {
      weightsJson: JSON.stringify(weights),
      initiativeTargetMonthly: body.initiativeTargetMonthly,
      initiativeTargetQuarterly: body.initiativeTargetQuarterly,
      gradeBandsJson: JSON.stringify(body.gradeBands),
      workingDaysJson: JSON.stringify(body.workingDays),
      holidaysJson: JSON.stringify(body.holidays || []),
    },
    create: {
      id: "singleton",
      weightsJson: JSON.stringify(weights),
      initiativeTargetMonthly: body.initiativeTargetMonthly,
      initiativeTargetQuarterly: body.initiativeTargetQuarterly,
      gradeBandsJson: JSON.stringify(body.gradeBands),
      workingDaysJson: JSON.stringify(body.workingDays),
      holidaysJson: JSON.stringify(body.holidays || []),
    },
  });
  await db.auditLog.create({
    data: { actorId: user.id, action: "UPDATE_SETTINGS", entity: "settings", entityId: "singleton", detail: `Pemberat: ${JSON.stringify(weights)}` },
  });
  return NextResponse.json({
    settings: {
      weights: JSON.parse(updated.weightsJson),
      initiativeTargetMonthly: updated.initiativeTargetMonthly,
      initiativeTargetQuarterly: updated.initiativeTargetQuarterly,
      gradeBands: JSON.parse(updated.gradeBandsJson),
      workingDays: JSON.parse(updated.workingDaysJson),
      holidays: JSON.parse(updated.holidaysJson),
    },
  });
});
