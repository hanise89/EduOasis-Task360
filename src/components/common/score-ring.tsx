"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  thickness?: number;
  label?: string;
  grade?: string;
  showGrade?: boolean;
  className?: string;
}

function scoreColor(score: number) {
  if (score >= 75) return "oklch(0.55 0.14 145)";
  if (score >= 60) return "oklch(0.70 0.15 75)";
  if (score >= 40) return "oklch(0.65 0.18 50)";
  return "oklch(0.55 0.20 27)";
}

export function ScoreRing({ score, size = 80, thickness = 6, label, grade, showGrade = false, className }: ScoreRingProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = scoreColor(score);
  return (
    <div className={cn("inline-flex flex-col items-center", className)} style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-muted/50"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-semibold tabular-nums leading-none num-display" style={{ fontSize: size * 0.30 }}>{Math.round(score)}</div>
          {showGrade && grade && (
            <div className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color }}>{grade}</div>
          )}
        </div>
      </div>
      {label && <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">{label}</div>}
    </div>
  );
}
