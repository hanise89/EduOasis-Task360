import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { withErrorHandler } from "@/lib/error-handler";
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user });
});
