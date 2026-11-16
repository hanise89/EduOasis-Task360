"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PeriodKey } from "@/types";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "quarter", label: "Suku Tahun" },
  { key: "all", label: "Sepanjang Tahun" },
];

export function PeriodSelector({ className }: { className?: string }) {
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);
  return (
    <div className={cn("inline-flex items-center gap-0.5 p-0.5 rounded-md bg-muted/60 border border-border", className)}>
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => setPeriod(p.key)}
          className={cn(
            "px-2.5 py-1 rounded text-xs font-medium transition-colors",
            period === p.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
