"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  index?: string | number;
  eyebrow?: string;
}

export function SectionHeader({ title, subtitle, action, icon: Icon, index, eyebrow }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="flex items-baseline gap-3 min-w-0">
        {index !== undefined && (
          <span className="index-numeral text-sm leading-none hidden sm:inline select-none">{typeof index === "number" ? String(index).padStart(2, "0") : index}</span>
        )}
        {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0 translate-y-0.5" />}
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
          <h2 className="text-sm lg:text-base font-semibold tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <Card className={cn("p-5 card-flat", className)}>
      <Skeleton className="h-3 w-28 mb-4" />
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-24" />
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-10 h-10 border border-border bg-muted/40 flex items-center justify-center mb-3 rounded-sm">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs text-pretty">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status, type = "task" }: { status: string; type?: "task" | "priority" | "workload" }) {
  const meta = type === "task"
    ? TASK_STATUS_META[status]
    : type === "priority"
      ? PRIORITY_META[status]
      : WORKLOAD_META[status];
  if (!meta) return <span className="text-xs">{status}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium border", meta.bg, meta.text, meta.border || "border-transparent")}>
      {type !== "priority" && <span className={cn("w-1.5 h-1.5 rounded-sm", (meta as any).dot || meta.text.replace("text-", "bg-"))} />}
      {meta.label}
    </span>
  );
}

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in-fade", className)}>
      {children}
    </div>
  );
}

// Re-export meta locally to keep StatusBadge self-contained
import { TASK_STATUS_META, PRIORITY_META, WORKLOAD_META } from "@/lib/meta";
