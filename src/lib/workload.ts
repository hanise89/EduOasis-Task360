// EDUOASIS TASK360 - Workload Engine
// Computes workload status per staff (PRD Section 6.6)

import { db } from "@/lib/db";
import { workloadStatusFor } from "@/lib/scoring";
import type { WorkloadInfo } from "@/types";

const DAY = 24 * 60 * 60 * 1000;

// Get start of current week (Monday)
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  d.setDate(diff);
  return d;
}

export async function getWorkloadForUser(userId: string, weeksAhead = 0): Promise<WorkloadInfo> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const weekStart = startOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + weeksAhead * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Active tasks: not completed/cancelled
  const activeTasks = await db.task.findMany({
    where: {
      assigneeId: userId,
      status: { in: ["Belum Mula", "Dalam Proses", "Menunggu Semakan", "Disekat"] },
      OR: [
        { startDate: { lte: weekEnd } },
        { dueDate: { gte: weekStart } },
      ],
    },
  });

  // Sum estimated hours of active tasks for the week
  const activeTaskHours = activeTasks.reduce((sum, t) => {
    // Distribute estimated hours proportionally across active weeks; for simplicity sum full
    return sum + t.estimatedHours;
  }, 0);

  const availableHoursWeek = user.weeklyHours;
  const utilisation = availableHoursWeek === 0 ? 0 : (activeTaskHours / availableHoursWeek) * 100;
  const status = workloadStatusFor(utilisation);

  return {
    userId,
    userName: user.name,
    activeTaskHours,
    availableHoursWeek,
    utilisation: Math.round(utilisation * 10) / 10,
    status,
    activeTasks: activeTasks.length,
  };
}

export async function getWorkloadForAllStaff(weeksAhead = 0): Promise<WorkloadInfo[]> {
  const staff = await db.user.findMany({ where: { role: "STAF", active: true }, orderBy: { name: "asc" } });
  const results: WorkloadInfo[] = [];
  for (const s of staff) {
    try {
      results.push(await getWorkloadForUser(s.id, weeksAhead));
    } catch (e) {
      console.error("Workload error", s.id, e);
    }
  }
  return results;
}

// Heatmap: staff x weeks (last 4 weeks + next 2)
export async function getWorkloadHeatmap() {
  const staff = await db.user.findMany({ where: { role: "STAF", active: true }, orderBy: { name: "asc" } });
  const weeks: { label: string; offset: number }[] = [];
  for (let i = -3; i <= 2; i++) {
    const ws = startOfWeek(new Date());
    ws.setDate(ws.getDate() + i * 7);
    const lbl = ws.toLocaleDateString("ms-MY", { day: "2-digit", month: "short" });
    weeks.push({ label: lbl, offset: i });
  }
  const matrix: { staff: { id: string; name: string; position: string; avatarColor: string }; cells: { utilisation: number; status: string; label: string }[] }[] = [];
  for (const s of staff) {
    const cells: { utilisation: number; status: string; label: string }[] = [];
    for (const w of weeks) {
      const wl = await getWorkloadForUser(s.id, w.offset);
      cells.push({ utilisation: wl.utilisation, status: wl.status, label: w.label });
    }
    matrix.push({ staff: { id: s.id, name: s.name, position: s.position, avatarColor: s.avatarColor }, cells });
  }
  return { weeks, matrix };
}
