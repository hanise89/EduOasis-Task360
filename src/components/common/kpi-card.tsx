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
  index?: number;
  onClick?: () => void;
}

const ACCENT_TEXT = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-status-success",
  warning: "text-status-warning",
  danger: "text-status-danger",
  neutral: "text-muted-foreground",
};

export function KpiCard({ label, value, hint, icon: Icon, trend, trendLabel, accent = "primary", index, onClick }: KpiCardProps) {
  const accentText = ACCENT_TEXT[accent];
  return (
    <Card
      className={cn(
        "p-4 lg:p-5 card-flat rounded-md bg-card relative overflow-hidden",
        onClick && "cursor-pointer hover:border-border-strong transition-colors"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {index !== undefined && (
            <span className="index-numeral text-[11px] leading-none select-none">{String(index).padStart(2, "0")}</span>
          )}
          <div className="eyebrow truncate">{label}</div>
        </div>
        {Icon && <Icon className={cn("w-3.5 h-3.5 shrink-0", accentText)} />}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-2xl lg:text-[28px] font-semibold tracking-tight num-display leading-none"
      >
        {value}
      </motion.div>
      {(hint || trend) && (
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          {trend && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", trend === "up" ? "text-status-success" : trend === "down" ? "text-status-danger" : "text-muted-foreground")}>
              {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            </span>
          )}
          {hint && <span className="text-muted-foreground truncate">{hint}</span>}
          {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
}
