import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { getCurrentUser } from "@/lib/session";

const execAsync = promisify(exec);

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "GM") return NextResponse.json({ error: "Hanya GM boleh set semula." }, { status: 403 });
  try {
    await execAsync("bun run prisma/seed.ts", { cwd: process.cwd() });
    return NextResponse.json({ ok: true, message: "Data demo telah diset semula." });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal set semula: " + e.message }, { status: 500 });
  }
}
