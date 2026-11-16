"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { initials, formatDate, daysUntil, TASK_STATUS_META, PRIORITY_META, CATEGORY_META } from "@/lib/meta";
import type { Task } from "@/types";
import * as Icons from "lucide-react";
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Clock, Paperclip, AlertTriangle, ChevronRight } from "lucide-react";

const COLUMNS = [
  { key: "Belum Mula", color: "border-t-status-neutral" },
  { key: "Dalam Proses", color: "border-t-status-info" },
  { key: "Menunggu Semakan", color: "border-t-status-warning" },
  { key: "Selesai", color: "border-t-status-success" },
  { key: "Disekat", color: "border-t-status-danger" },
];

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-8 w-full mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto scroll-slim pb-2">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <KanbanColumn key={col.key} column={col} tasks={colTasks} onOpenTask={onOpenTask} />
            );
          })}
        </div>
      </DndContext>
      <p className="text-[10px] text-muted-foreground text-center">
        Seret kad tugasan antara lajur untuk mengubah status. Staf perlu hantar ke "Menunggu Semakan" untuk diluluskan GM.
      </p>
    </div>
  );
}

function KanbanColumn({ column, tasks, onOpenTask }: { column: any; tasks: Task[]; onOpenTask: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const meta = TASK_STATUS_META[column.key];
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg bg-muted/30 min-h-[200px] transition-colors",
        isOver && "bg-accent/10 ring-2 ring-accent/30"
      )}
    >
      <div className={cn("flex items-center justify-between px-3 py-2 border-t-2 rounded-t-lg bg-card", column.color)}>
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", meta?.dot)} />
          <span className="text-xs font-semibold uppercase tracking-wide">{column.key}</span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tasks.length}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto scroll-slim">
        {tasks.length === 0 ? (
          <div className="text-[10px] text-muted-foreground text-center py-4">Tiada tugasan</div>
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "bg-card border border-border rounded-md p-2.5 cursor-grab active:cursor-grabbing hover:border-accent/40 hover:shadow-sm transition-all",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {CatIcon && <CatIcon className="w-3 h-3 text-muted-foreground" />}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{task.category}</span>
        <span className={cn("ml-auto text-[9px] px-1 py-0.5 rounded font-medium", prioMeta?.bg, prioMeta?.text)}>{task.priority}</span>
      </div>
      <div className="text-xs font-medium leading-snug line-clamp-2 mb-1.5">{task.title}</div>
      {task.progress > 0 && task.status !== "Selesai" && (
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-1.5">
          <div className="h-full bg-accent" style={{ width: `${task.progress}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {task.assignee && (
            <Avatar className="w-4 h-4">
              <AvatarFallback style={{ backgroundColor: task.assignee.avatarColor }} className="text-white text-[7px] font-semibold">
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
          {task.links && task.links.length > 0 && <Paperclip className="w-2.5 h-2.5" />}
          {task.blockers && task.blockers.some((b) => b.status === "Terbuka") && <AlertTriangle className="w-2.5 h-2.5 text-status-danger" />}
        </div>
      </div>
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
    <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") setFilters({ ...filters, search }); }}
        placeholder="Cari tugasan..."
        className="h-8 px-2 text-xs rounded border border-input bg-background flex-1 min-w-[140px]"
      />
      <select value={filters.status || "all"} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-8 px-2 text-xs rounded border border-input bg-background">
        <option value="all">Semua Status</option>
        {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
        <option value="Dibatalkan">Dibatalkan</option>
      </select>
      <select value={filters.category || "all"} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="h-8 px-2 text-xs rounded border border-input bg-background">
        <option value="all">Semua Kategori</option>
        {Object.keys(CATEGORY_META).map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filters.priority || "all"} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="h-8 px-2 text-xs rounded border border-input bg-background">
        <option value="all">Semua Keutamaan</option>
        {Object.keys(PRIORITY_META).map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {user.role === "GM" && (
        <select value={filters.assigneeId || "all"} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })} className="h-8 px-2 text-xs rounded border border-input bg-background">
          <option value="all">Semua Staf</option>
          {staffData?.users.filter((u) => u.role === "STAF").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      )}
      <button onClick={() => { setSearch(""); setFilters({}); }} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">Reset</button>
    </div>
  );
}
