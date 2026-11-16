// Session helper - reads current user from cookie for API routes
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("task360_session")?.value;
  if (!sessionId) return null;
  const user = await db.user.findUnique({ where: { id: sessionId } });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "GM" | "STAF",
    position: user.position,
    weeklyHours: user.weeklyHours,
    avatarColor: user.avatarColor,
    startDate: user.startDate.toISOString(),
    active: user.active,
  };
}

export function requireRole(user: User | null, role: "GM" | "STAF") {
  if (!user) return false;
  if (role === "GM") return user.role === "GM";
  return true;
}
