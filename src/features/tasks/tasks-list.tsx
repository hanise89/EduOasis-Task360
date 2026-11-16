"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useFilters } from "@/features/tasks/tasks-kanban";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initials, formatDate, daysUntil, TASK_STATUS_META, PRIORITY_META, CATEGORY_META } from "@/lib/meta";
import type { Task } from "@/types";
import * as Icons from "lucide-react";
import { Clock, Paperclip, AlertTriangle, Pencil, Trash2, ChevronUp, ChevronDown, Inbox } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TasksList({ onOpenTask, onEditTask }: { onOpenTask: (id: string) => void; onEditTask: (id: string) => void }) {
  const user = useAppStore((s) => s.user)!;
  const qc = useQueryClient();
  const [filters, setFilters] = useFilters();
  const [sortKey, setSortKey] = useState<string>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", filters, "list"],
    queryFn: () => apiGet<{ tasks: Task[] }>(`/api/tasks?${new URLSearchParams(filters as any).toString()}`),
  });

  let tasks = data?.tasks || [];
  tasks = [...tasks].sort((a, b) => {
    let va: any = a[sortKey as keyof Task], vb: any = b[sortKey as keyof Task];
    if (sortKey === "assignee") { va = a.assignee?.name || ""; vb = b.assignee?.name || ""; }
    if (va == null) va = "";
    if (vb == null) vb = "";
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  });

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await apiDelete(`/api/tasks/${deleteId}`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tugasan dipadam.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteId(null);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <TaskFiltersBar filters={filters} setFilters={setFilters} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-medium py-2.5 px-3"><SortBtn label="Tugasan" k="title" sortKey={sortKey} sortDir={sortDir} onSort={(k, d) => { setSortKey(k); setSortDir(d); }} /></th>
                <th className="text-left font-medium py-2.5 px-3 hidden md:table-cell"><SortBtn label="Penerima" k="assignee" sortKey={sortKey} sortDir={sortDir} onSort={(k, d) => { setSortKey(k); setSortDir(d); }} /></th>
                <th className="text-left font-medium py-2.5 px-3 hidden lg:table-cell">Kategori</th>
                <th className="text-left font-medium py-2.5 px-3 hidden sm:table-cell">Keutamaan</th>
                <th className="text-left font-medium py-2.5 px-3">Status</th>
                <th className="text-left font-medium py-2.5 px-3"><SortBtn label="Tarikh Akhir" k="dueDate" sortKey={sortKey} sortDir={sortDir} onSort={(k, d) => { setSortKey(k); setSortDir(d); }} /></th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  Tiada tugasan dijumpai.
                </td></tr>
              ) : tasks.map((t) => {
                const daysLeft = daysUntil(t.extendedDueDate || t.dueDate);
                const overdue = daysLeft < 0 && t.status !== "Selesai" && t.status !== "Dibatalkan";
                const catMeta = CATEGORY_META[t.category as string];
                const CatIcon = catMeta ? (Icons as any)[catMeta.icon] : Icons.Folder;
                const prioMeta = PRIORITY_META[t.priority as string];
                const statusMeta = TASK_STATUS_META[t.status as string];
                return (
                  <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="py-3 px-3">
                      <button onClick={() => onOpenTask(t.id)} className="text-left">
                        <div className="font-medium text-sm group-hover:text-accent line-clamp-1">{t.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.progress > 0 && t.status !== "Selesai" && (
                            <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: `${t.progress}%` }} />
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            {t.links && t.links.length > 0 && <Paperclip className="w-2.5 h-2.5" />}
                            {t.blockers && t.blockers.some((b) => b.status === "Terbuka") && <AlertTriangle className="w-2.5 h-2.5 text-status-danger" />}
                            {t.complexity > 1 && <span className="text-[9px]">C{t.complexity}</span>}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      {t.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback style={{ backgroundColor: t.assignee.avatarColor }} className="text-white text-[8px] font-semibold">{initials(t.assignee.name)}</AvatarFallback>
                          </Avatar>
                          <div className="text-xs">
                            <div className="font-medium truncate max-w-[100px]">{t.assignee.name}</div>
                            <div className="text-[9px] text-muted-foreground truncate max-w-[100px]">{t.assignee.position}</div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {CatIcon && <CatIcon className="w-3 h-3" />}{t.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", prioMeta?.bg, prioMeta?.text)}>{t.priority}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md", statusMeta?.bg, statusMeta?.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", statusMeta?.dot)} />
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className={cn("text-xs inline-flex items-center gap-1", overdue ? "text-status-danger font-medium" : daysLeft <= 3 && t.status !== "Selesai" ? "text-status-warning" : "text-muted-foreground")}>
                        <Clock className="w-3 h-3" />
                        {formatDate(t.extendedDueDate || t.dueDate, { day: "2-digit", month: "short" })}
                        {overdue && <span className="text-[9px]">({Math.abs(daysLeft)}h lewat)</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditTask(t.id)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {user.role === "GM" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-status-danger hover:text-status-danger" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Tugasan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak boleh diundur. Tugasan dan semua data berkaitan (komen, log masa, penilaian) akan dipadam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-status-danger text-white hover:bg-status-danger/90">Padam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortBtn({ label, k, sortKey, sortDir, onSort }: { label: string; k: string; sortKey: string; sortDir: "asc" | "desc"; onSort: (k: string, d: "asc" | "desc") => void }) {
  return (
    <button onClick={() => onSort(k, sortKey === k && sortDir === "asc" ? "desc" : "asc")} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      {sortKey === k ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
    </button>
  );
}

// Local filter bar (duplicate of kanban's but standalone for list)
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
        {Object.keys(TASK_STATUS_META).map((s) => <option key={s} value={s}>{s}</option>)}
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
