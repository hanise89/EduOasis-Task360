"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  accent?: "primary" | "accent" | "success" | "warning" | "danger" | "neutral";
  onClick?: () => void;
}

const ACCENT_MAP = {
  primary: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/20" },
  accent: { bg: "bg-accent/10", text: "text-accent", ring: "ring-accent/20" },
  success: { bg: "bg-status-success/10", text: "text-status-success", ring: "ring-status-success/20" },
  warning: { bg: "bg-status-warning/15", text: "text-status-warning", ring: "ring-status-warning/20" },
  danger: { bg: "bg-status-danger/10", text: "text-status-danger", ring: "ring-status-danger/20" },
  neutral: { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border" },
};

export function KpiCard({ label, value, hint, icon: Icon, trend, trendLabel, accent = "primary", onClick }: KpiCardProps) {
  const a = ACCENT_MAP[accent];
  return (
    <Card
      className={cn("p-4 lg:p-5 card-flat relative overflow-hidden", onClick && "cursor-pointer hover:shadow-md transition-shadow")}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-2xl lg:text-3xl font-semibold tracking-tight mt-1.5 tabular-nums"
          >
            {value}
          </motion.div>
          {(hint || trend) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              {trend && (
                <span className={cn("inline-flex items-center gap-0.5 font-medium", trend === "up" ? "text-status-success" : trend === "down" ? "text-status-danger" : "text-muted-foreground")}>
                  {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                </span>
              )}
              {hint && <span className="text-muted-foreground truncate">{hint}</span>}
              {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", a.bg, a.text)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className={cn("absolute inset-x-0 top-0 h-0.5", a.bg.replace("/10", "").replace("/15", ""))} />
    </Card>
  );
}
