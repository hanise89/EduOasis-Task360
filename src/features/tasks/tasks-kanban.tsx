"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { initials, formatDate, daysUntil, PRIORITY_META, CATEGORY_META } from "@/lib/meta";
import type { Task } from "@/types";
import * as Icons from "lucide-react";
import {
  DndContext, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Clock, Paperclip, AlertTriangle, GripVertical } from "lucide-react";

const COLUMNS = [
  { key: "Belum Mula", accent: "var(--status-neutral)" },
  { key: "Dalam Proses", accent: "var(--status-info)" },
  { key: "Menunggu Semakan", accent: "var(--status-warning)" },
  { key: "Selesai", accent: "var(--status-success)" },
  { key: "Disekat", accent: "var(--status-danger)" },
];

// Priority accent colors for the 2px left bar on cards
const PRIORITY_BAR: Record<string, string> = {
  Rendah: "var(--status-neutral)",
  Sederhana: "var(--status-info)",
  Tinggi: "var(--status-warning)",
  Segera: "var(--status-danger)",
};

export function TasksKanban({ onOpenTask, onEditTask }: { onOpenTask: (id: string) => void; onEditTask: (id: string) => void }) {
  const user = useAppStore((s) => s.user)!;
  const qc = useQueryClient();
  const [filters, setFilters] = useFilters();
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => apiGet<{ tasks: Task[] }>(`/api/tasks?${new URLSearchParams(filters as any).toString()}`),
  });

  const tasks = data?.tasks || [];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  async function handleDragEnd(taskId: string, newStatus: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    // Permission: staff can't move to Selesai (only GM approves)
    if (user.role === "STAF" && newStatus === "Selesai") {
      toast.error("Anda perlu hantar ke 'Menunggu Semakan' untuk diluluskan GM.");
      return;
    }
    try {
      await apiPatch(`/api/tasks/${taskId}/status`, { status: newStatus });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["gm-dashboard"] });
      qc.invalidateQueries({ queryKey: ["staff-dashboard"] });
      toast.success(`Status dikemas kini: ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-r border-border last:border-r-0 pr-3">
            <Skeleton className="h-7 w-full mb-2 rounded-sm" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full rounded-sm" />
              <Skeleton className="h-24 w-full rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TaskFiltersBar filters={filters} setFilters={setFilters} />
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e) => {
        const { active, over } = e;
        if (over && active.id !== over.id) {
          handleDragEnd(String(active.id), String(over.id));
        }
      }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 overflow-x-auto scroll-slim pb-2 border border-border card-flat rounded-md">
          {COLUMNS.map((col, idx) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <KanbanColumn
                key={col.key}
                column={col}
                tasks={colTasks}
                onOpenTask={onOpenTask}
                isLast={idx === COLUMNS.length - 1}
              />
            );
          })}
        </div>
      </DndContext>
      <p className="text-[10px] text-muted-foreground text-center eyebrow">
        Seret kad tugasan antara lajur untuk mengubah status. Staf perlu hantar ke &ldquo;Menunggu Semakan&rdquo; untuk diluluskan GM.
      </p>
    </div>
  );
}

function KanbanColumn({ column, tasks, onOpenTask, isLast }: { column: any; tasks: Task[]; onOpenTask: (id: string) => void; isLast?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-card min-h-[240px] transition-colors",
        !isLast && "border-r border-border",
        isOver && "bg-accent/5"
      )}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b border-border"
        style={{ borderTopColor: column.accent, borderTopWidth: 2, borderTopStyle: "solid" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-sm shrink-0"
            style={{ backgroundColor: column.accent }}
            aria-hidden
          />
          <span className="eyebrow truncate">{column.key}</span>
        </div>
        <span className="text-[11px] font-semibold text-foreground tabular-nums leading-none">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto scroll-slim">
        {tasks.length === 0 ? (
          <div className="text-[10px] text-muted-foreground text-center py-6 italic">Tiada tugasan</div>
        ) : (
          tasks.map((t) => <KanbanCard key={t.id} task={t} onOpen={() => onOpenTask(t.id)} />)
        )}
      </div>
    </div>
  );
}

function KanbanCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const catMeta = CATEGORY_META[task.category as string];
  const CatIcon = catMeta ? (Icons as any)[catMeta.icon] : Icons.Folder;
  const daysLeft = daysUntil(task.extendedDueDate || task.dueDate);
  const overdue = daysLeft < 0 && task.status !== "Selesai" && task.status !== "Dibatalkan";
  const prioMeta = PRIORITY_META[task.priority as string];
  const prioColor = PRIORITY_BAR[task.priority as string] || "var(--status-neutral)";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "relative bg-card card-flat rounded-sm p-3 pl-4 cursor-grab active:cursor-grabbing hover:border-border-strong transition-colors",
        isDragging && "opacity-50 ring-1 ring-accent/30"
      )}
      style={{ ...style, borderLeftColor: prioColor, borderLeftWidth: 2, borderLeftStyle: "solid" } as React.CSSProperties}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {CatIcon && <CatIcon className="w-3 h-3 text-muted-foreground shrink-0" />}
        <span className="eyebrow text-[9px]">{task.category}</span>
        <GripVertical className="w-3 h-3 text-muted-foreground/50 ml-auto" aria-hidden />
      </div>
      <div className="text-xs font-medium leading-snug line-clamp-2 mb-1.5 pr-3">{task.title}</div>
      {task.progress > 0 && task.status !== "Selesai" && (
        <div className="h-1 bg-muted overflow-hidden mb-1.5 rounded-sm">
          <div className="h-full bg-accent" style={{ width: `${task.progress}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
        <div className="flex items-center gap-1.5">
          {task.assignee && (
            <Avatar className="w-4 h-4 rounded-sm">
              <AvatarFallback style={{ backgroundColor: task.assignee.avatarColor, borderRadius: 2 }} className="text-white text-[7px] font-semibold">
                {initials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
          <span className={cn("inline-flex items-center gap-0.5", overdue ? "text-status-danger font-medium" : daysLeft <= 3 ? "text-status-warning" : "")}>
            <Clock className="w-2.5 h-2.5" />
            {task.status === "Selesai" ? formatDate(task.completedAt || task.dueDate, { day: "2-digit", month: "short" }) : overdue ? `Lewat ${Math.abs(daysLeft)}h` : daysLeft === 0 ? "Hari ini" : `${daysLeft}h`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {task.links && task.links.length > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip className="w-2.5 h-2.5" />
              <span className="tabular-nums">{task.links.length}</span>
            </span>
          )}
          {task.blockers && task.blockers.some((b) => b.status === "Terbuka") && <AlertTriangle className="w-2.5 h-2.5 text-status-danger" />}
        </div>
      </div>
      {prioMeta && (
        <span
          className="absolute top-2 right-2 text-[9px] font-medium px-1 py-0.5 rounded-sm border tabular-nums"
          style={{ color: prioColor, borderColor: prioColor }}
        >
          {task.priority}
        </span>
      )}
    </div>
  );
}

// Hooks & filter bar shared between kanban & list
export function useFilters() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  return [filters, setFilters] as const;
}

function TaskFiltersBar({ filters, setFilters }: { filters: Record<string, string>; setFilters: (f: Record<string, string>) => void }) {
  const user = useAppStore((s) => s.user)!;
  const [search, setSearch] = useState("");
  const { data: staffData } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<{ users: any[] }>("/api/users"),
    enabled: user.role === "GM",
  });
  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-md card-flat">
      <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
        <span className="eyebrow shrink-0 hidden sm:inline">Cari</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setFilters({ ...filters, search }); }}
          placeholder="Cari tugasan..."
          className="h-8 px-2 text-xs rounded-sm border border-input bg-background w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={filters.status || "all"} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-8 px-2 text-xs rounded-sm border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="all">Semua Status</option>
          {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
          <option value="Dibatalkan">Dibatalkan</option>
        </select>
        <select value={filters.category || "all"} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="h-8 px-2 text-xs rounded-sm border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="all">Semua Kategori</option>
          {Object.keys(CATEGORY_META).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.priority || "all"} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="h-8 px-2 text-xs rounded-sm border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="all">Semua Keutamaan</option>
          {Object.keys(PRIORITY_META).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {user.role === "GM" && (
          <select value={filters.assigneeId || "all"} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })} className="h-8 px-2 text-xs rounded-sm border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">Semua Staf</option>
            {staffData?.users.filter((u) => u.role === "STAF").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <button onClick={() => { setSearch(""); setFilters({}); }} className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground rounded-sm border border-transparent hover:border-border transition-colors">Reset</button>
      </div>
    </div>
  );
}
