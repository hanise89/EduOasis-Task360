"use client";

import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { TasksKanban } from "@/features/tasks/tasks-kanban";
import { TasksList } from "@/features/tasks/tasks-list";
import { TaskDetail } from "@/features/tasks/task-detail";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, LayoutGrid, List as ListIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function TasksView() {
  const user = useAppStore((s) => s.user)!;
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);
  const [mode, setMode] = useState<"kanban" | "list">("kanban");
  const [formOpen, setFormOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const qc = useQueryClient();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap hairline-b pb-4">
        <div>
          <div className="eyebrow mb-1.5">Mod Pengurusan Tugasan</div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Tugasan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user.role === "GM" ? "Urus dan pantau semua tugasan pasukan" : "Tugasan yang ditugaskan kepada anda"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-0 p-0 rounded-sm bg-muted/40 border border-border card-flat">
            <button
              onClick={() => setMode("kanban")}
              aria-pressed={mode === "kanban"}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-medium inline-flex items-center gap-1.5 transition-colors tabular-nums",
                mode === "kanban" ? "bg-background text-foreground border border-border-strong" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setMode("list")}
              aria-pressed={mode === "list"}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-medium inline-flex items-center gap-1.5 transition-colors tabular-nums",
                mode === "list" ? "bg-background text-foreground border border-border-strong" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListIcon className="w-3.5 h-3.5" /> Senarai
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditTaskId(null); setFormOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1" /> Tugasan Baharu
          </Button>
        </div>
      </div>

      {mode === "kanban" ? (
        <TasksKanban onOpenTask={(id) => setSelectedTaskId(id)} onEditTask={(id) => { setEditTaskId(id); setFormOpen(true); }} />
      ) : (
        <TasksList onOpenTask={(id) => setSelectedTaskId(id)} onEditTask={(id) => { setEditTaskId(id); setFormOpen(true); }} />
      )}

      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onEdit={() => { setEditTaskId(selectedTaskId); setSelectedTaskId(null); setFormOpen(true); }}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
        />
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditTaskId(null); }}
        editTaskId={editTaskId}
        onSaved={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
      />
    </div>
  );
}
