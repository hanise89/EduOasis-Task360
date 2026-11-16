"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PeriodKey } from "@/types";

const PERIODS: { key: PeriodKey; label: string; short: string }[] = [
  { key: "week", label: "Minggu Ini", short: "Mgg" },
  { key: "month", label: "Bulan Ini", short: "Bln" },
  { key: "quarter", label: "Suku Tahun", short: "Suk" },
  { key: "all", label: "Sepanjang Tahun", short: "Thn" },
];

export function PeriodSelector({ className }: { className?: string }) {
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);
  return (
    <div className={cn("inline-flex items-stretch border border-border bg-card rounded-sm overflow-hidden", className)}>
      {PERIODS.map((p, i) => (
        <button
          key={p.key}
          onClick={() => setPeriod(p.key)}
          className={cn(
            "px-2.5 lg:px-3 py-1 text-xs font-medium transition-colors relative",
            i > 0 && "border-l border-border",
            period === p.key
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <span className="hidden sm:inline">{p.label}</span>
          <span className="sm:hidden">{p.short}</span>
        </button>
      ))}
    </div>
  );
}
