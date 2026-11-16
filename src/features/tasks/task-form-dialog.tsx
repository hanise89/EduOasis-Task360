"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link as LinkIcon, Plus, X } from "lucide-react";
import type { Task } from "@/types";

const CATEGORIES = ["Latihan", "Perundingan", "Pemasaran", "Pentadbiran", "Kewangan", "Sekolah Berlesen", "Lain"];
const PRIORITIES = ["Rendah", "Sederhana", "Tinggi", "Segera"];

export function TaskFormDialog({ open, onOpenChange, editTaskId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; editTaskId: string | null; onSaved: () => void }) {
  const user = useAppStore((s) => s.user)!;
  const { data: staffData } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<{ users: any[] }>("/api/users"),
    enabled: user.role === "GM",
  });
  const { data: editData } = useQuery({
    queryKey: ["task", editTaskId],
    queryFn: () => apiGet<{ task: Task }>(`/api/tasks/${editTaskId}`),
    enabled: !!editTaskId,
  });

  const [form, setForm] = useState<any>({
    title: "", description: "", assigneeId: "", category: "Latihan", priority: "Sederhana",
    complexity: 1, estimatedHours: 8, startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), links: [], isPersonal: false,
  });
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    if (editData?.task) {
      const t = editData.task;
      setForm({
        title: t.title, description: t.description, assigneeId: t.assigneeId, category: t.category,
        priority: t.priority, complexity: t.complexity, estimatedHours: t.estimatedHours,
        startDate: t.startDate.slice(0, 10), dueDate: t.dueDate.slice(0, 10),
        links: t.links || [], isPersonal: t.isPersonal,
      });
    } else if (!editTaskId) {
      setForm({
        title: "", description: "", assigneeId: staffData?.users.find((u) => u.role === "STAF")?.id || "",
        category: "Latihan", priority: "Sederhana", complexity: 1, estimatedHours: 8,
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        links: [], isPersonal: false,
      });
    }
  }, [editData, editTaskId, staffData]);

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error("Tajuk diperlukan."); return; }
    if (!form.isPersonal && !form.assigneeId) { toast.error("Sila pilih penerima."); return; }
    if (!form.dueDate) { toast.error("Tarikh akhir diperlukan."); return; }
    try {
      if (editTaskId) {
        await apiPatch(`/api/tasks/${editTaskId}`, form);
        toast.success("Tugasan dikemas kini.");
      } else {
        await apiPost("/api/tasks", form);
        toast.success("Tugasan dicipta.");
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scroll-slim rounded-md">
        <DialogHeader>
          <DialogTitle className="tracking-tight">{editTaskId ? "Edit Tugasan" : "Cipta Tugasan Baharu"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Section: Asas */}
          <div className="space-y-3">
            <div className="eyebrow">Asas</div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Tajuk <span className="text-status-danger">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="cth. Menyediakan modul latihan kepimpinan" className="rounded-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Penerangan</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Perincian keperluan, skop dan keputusan yang dijangka" rows={3} className="rounded-sm" />
            </div>
            {!form.isPersonal && user.role === "GM" && (
              <div className="space-y-1.5">
                <Label className="eyebrow">Tugaskan Kepada <span className="text-status-danger">*</span></Label>
                <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className="h-9 px-2 text-sm rounded-sm border border-input bg-background w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">— Pilih Staf —</option>
                  {staffData?.users.filter((u) => u.role === "STAF" && u.active).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} — {u.position}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="eyebrow">Kategori</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-9 px-2 text-sm rounded-sm border border-input bg-background w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="eyebrow">Keutamaan</Label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="h-9 px-2 text-sm rounded-sm border border-input bg-background w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="eyebrow">Tarikh Mula</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-sm tabular-nums" />
              </div>
              <div className="space-y-1.5">
                <Label className="eyebrow">Tarikh Akhir <span className="text-status-danger">*</span></Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="rounded-sm tabular-nums" />
              </div>
            </div>
          </div>

          {/* Section: Pemberat & Kerumitan */}
          <div className="space-y-3 hairline-t pt-4">
            <div className="eyebrow">Pemberat &amp; Kerumitan</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="eyebrow">Kerumitan</Label>
                <select value={form.complexity} onChange={(e) => setForm({ ...form, complexity: Number(e.target.value) })} className="h-9 px-2 text-sm rounded-sm border border-input bg-background w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value={1}>1 — Mudah</option>
                  <option value={2}>2 — Sederhana</option>
                  <option value={3}>3 — Rumit</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="eyebrow">Anggaran Jam</Label>
                <Input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} className="rounded-sm tabular-nums" />
              </div>
            </div>
          </div>

          {/* Section: Lampiran */}
          <div className="space-y-3 hairline-t pt-4">
            <div className="eyebrow">Lampiran</div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Pautan Lampiran</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://..." className="pl-8 h-9 text-sm rounded-sm" />
                </div>
                <Button type="button" variant="outline" size="icon" className="rounded-sm" onClick={() => { if (newLink) { setForm({ ...form, links: [...form.links, newLink] }); setNewLink(""); } }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.links.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {form.links.map((l: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1 rounded-sm border border-border tabular-nums">
                      <a href={l} target="_blank" rel="noreferrer" className="truncate max-w-[120px] hover:underline">Lampiran {i + 1}</a>
                      <button onClick={() => setForm({ ...form, links: form.links.filter((_: string, j: number) => j !== i) })} aria-label="Buang lampiran"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {user.role === "STAF" && !editTaskId && (
            <div className="flex items-center justify-between p-3 rounded-sm border border-border bg-muted/30">
              <div>
                <Label className="eyebrow">Tugasan Peribadi</Label>
                <p className="text-[10px] text-muted-foreground mt-1">Tandakan jika ini tugasan peribadi anda sendiri</p>
              </div>
              <Switch checked={form.isPersonal} onCheckedChange={(c) => setForm({ ...form, isPersonal: c })} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-sm" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button className="rounded-sm" onClick={handleSubmit}>{editTaskId ? "Simpan" : "Cipta Tugasan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
