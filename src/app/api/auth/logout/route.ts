import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
export const POST = withErrorHandler(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("task360_session");
  return res;
});
