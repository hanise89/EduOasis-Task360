"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { initials, formatDate, formatDateTime, relativeTime, TASK_STATUS_META, PRIORITY_META, CATEGORY_META, GRADE_META } from "@/lib/meta";
import type { Task } from "@/types";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import {
  Clock, Paperclip, AlertTriangle, Send, History, MessageSquare, FileText,
  CheckCircle2, RotateCcw, Plus, Link as LinkIcon, Star, Calendar, User as UserIcon,
  TrendingUp, Hourglass, ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

export function TaskDetail({ taskId, onClose, onEdit, onRefresh }: { taskId: string; onClose: () => void; onEdit: () => void; onRefresh: () => void }) {
  const user = useAppStore((s) => s.user)!;
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [blockerOpen, setBlockerOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [extOpen, setExtOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => apiGet<{ task: Task }>(`/api/tasks/${taskId}`),
  });

  const task = data?.task;

  async function updateStatus(status: string) {
    try {
      await apiPatch(`/api/tasks/${taskId}/status`, { status });
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["gm-dashboard"] });
      qc.invalidateQueries({ queryKey: ["staff-dashboard"] });
      toast.success(`Status dikemas kini: ${status}`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function updateProgress() {
    if (progress === null) return;
    try {
      await apiPatch(`/api/tasks/${taskId}/status`, { progress });
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Kemajuan dikemas kini: ${progress}%`);
      setProgress(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function sendComment() {
    if (!comment.trim()) return;
    try {
      await apiPost(`/api/tasks/${taskId}/comments`, { body: comment });
      setComment("");
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Komen dihantar.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-y-auto scroll-slim">
        {isLoading || !task ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                <span>{task.category}</span>
                <span>·</span>
                <span className={cn("font-medium", PRIORITY_META[task.priority as string]?.text)}>{task.priority}</span>
                {task.complexity > 1 && <><span>·</span><span>Kerumitan {task.complexity}/3</span></>}
              </div>
              <SheetTitle className="text-lg leading-snug">{task.title}</SheetTitle>
              <SheetDescription className="text-sm leading-relaxed mt-1">{task.description}</SheetDescription>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  {task.assignee && (
                    <Avatar className="w-5 h-5">
                      <AvatarFallback style={{ backgroundColor: task.assignee.avatarColor }} className="text-white text-[8px] font-semibold">{initials(task.assignee.name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-medium">{task.assignee?.name || "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span className={cn(daysUntil(task.extendedDueDate || task.dueDate) < 0 && task.status !== "Selesai" ? "text-status-danger font-medium" : "")}>
                    {formatDate(task.extendedDueDate || task.dueDate)}
                    {task.extendedDueDate && <span className="ml-1 text-[9px] text-accent">(dilanjutkan)</span>}
                  </span>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium", TASK_STATUS_META[task.status as string]?.bg, TASK_STATUS_META[task.status as string]?.text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", TASK_STATUS_META[task.status as string]?.dot)} />
                  {task.status}
                </span>
              </div>
              {task.links && task.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.links.map((l, i) => (
                    <a key={i} href={l} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline px-2 py-0.5 rounded bg-accent/5">
                      <LinkIcon className="w-3 h-3" /> Lampiran {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </SheetHeader>

            {/* Action buttons */}
            <div className="px-5 py-3 border-b border-border flex flex-wrap gap-2">
              {user.role === "STAF" && task.assigneeId === user.id && (
                <>
                  {task.status === "Belum Mula" && (
                    <Button size="sm" onClick={() => updateStatus("Dalam Proses")}><TrendingUp className="w-3.5 h-3.5 mr-1" /> Mula</Button>
                  )}
                  {task.status === "Dalam Proses" && (
                    <Button size="sm" onClick={() => updateStatus("Menunggu Semakan")}><Send className="w-3.5 h-3.5 mr-1" /> Hantar untuk Semakan</Button>
                  )}
                  {task.status === "Disekat" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus("Dalam Proses")}><RotateCcw className="w-3.5 h-3.5 mr-1" /> Sambung Semula</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setBlockerOpen(true)}><ShieldAlert className="w-3.5 h-3.5 mr-1" /> Laporkan Halangan</Button>
                  <Button size="sm" variant="outline" onClick={() => setExtOpen(true)}><Hourglass className="w-3.5 h-3.5 mr-1" /> Mohon Lanjutan</Button>
                </>
              )}
              {user.role === "GM" && task.status === "Menunggu Semakan" && (
                <>
                  <Button size="sm" onClick={() => setReviewOpen(true)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Lulus &amp; Nilai</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus("Dalam Proses")}><RotateCcw className="w-3.5 h-3.5 mr-1" /> Pulangkan untuk Semakan Semula</Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => setLogOpen(true)}><Clock className="w-3.5 h-3.5 mr-1" /> Log Masa</Button>
              <Button size="sm" variant="ghost" onClick={onEdit}><FileText className="w-3.5 h-3.5 mr-1" /> Edit</Button>
            </div>

            {/* Progress */}
            {task.status !== "Selesai" && task.status !== "Dibatalkan" && (
              <div className="px-5 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium text-muted-foreground">Kemajuan Tugasan</Label>
                  <span className="text-xs font-semibold tabular-nums">{progress ?? task.progress}%</span>
                </div>
                <Slider
                  value={[progress ?? task.progress]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setProgress(v)}
                  onValueCommit={() => updateProgress()}
                />
              </div>
            )}

            <Tabs defaultValue="comments" className="px-5 py-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="comments" className="text-xs"><MessageSquare className="w-3.5 h-3.5 mr-1" /> Komen</TabsTrigger>
                <TabsTrigger value="blockers" className="text-xs"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Halangan</TabsTrigger>
                <TabsTrigger value="logs" className="text-xs"><Clock className="w-3.5 h-3.5 mr-1" /> Log Masa</TabsTrigger>
                <TabsTrigger value="history" className="text-xs"><History className="w-3.5 h-3.5 mr-1" /> Sejarah</TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis komen..." className="text-sm min-h-[60px]" />
                  <Button size="icon" onClick={sendComment} disabled={!comment.trim()}><Send className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto scroll-slim">
                  {task.comments?.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6">Tiada komen. Mulakan perbualan.</div>
                  ) : (
                    task.comments?.map((c) => (
                      <div key={c.id} className={cn("flex gap-2", c.isFromGM && "flex-row-reverse")}>
                        <Avatar className="w-6 h-6 shrink-0">
                          <AvatarFallback style={{ backgroundColor: c.author?.avatarColor || (c.isFromGM ? "#1F3A5F" : "#0E7C86") }} className="text-white text-[9px] font-semibold">
                            {c.author ? initials(c.author.name) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-[75%]", c.isFromGM && "text-right")}>
                          <div className="text-[10px] text-muted-foreground mb-0.5">
                            {c.author?.name} · {relativeTime(c.createdAt)}
                            {c.isFromGM && <span className="ml-1 px-1 rounded bg-primary/10 text-primary font-medium">GM</span>}
                          </div>
                          <div className={cn("text-sm rounded-lg px-3 py-2 inline-block text-left", c.isFromGM ? "bg-primary/10" : "bg-muted")}>{c.body}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="blockers" className="mt-4 space-y-2">
                {task.blockers?.filter((b) => b.status === "Terbuka").length === 0 && task.blockers?.filter((b) => b.status === "Selesai").length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-6">Tiada halangan dilaporkan.</div>
                ) : (
                  <>
                    {task.blockers?.filter((b) => b.status === "Terbuka").map((b) => (
                      <div key={b.id} className="p-3 rounded-md border border-status-danger/30 bg-status-danger/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-status-danger uppercase tracking-wide">{b.type}</span>
                          <span className="text-[10px] text-muted-foreground">{relativeTime(b.reportedAt)}</span>
                        </div>
                        <div className="text-sm font-medium">{b.description}</div>
                        {b.helpNeeded && <div className="text-xs text-muted-foreground mt-1">Bantuan diperlukan: {b.helpNeeded}</div>}
                        <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={async () => { await apiPatch(`/api/blockers/${b.id}/resolve`, {}); qc.invalidateQueries({ queryKey: ["task", taskId] }); toast.success("Halangan ditanda selesai."); }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Tanda Selesai
                        </Button>
                      </div>
                    ))}
                    {task.blockers?.filter((b) => b.status === "Selesai").map((b) => (
                      <div key={b.id} className="p-3 rounded-md border border-border bg-muted/30 opacity-70">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                          <span className="text-xs font-medium">{b.type}</span>
                          <span className="text-[10px] text-muted-foreground">Selesai</span>
                        </div>
                        <div className="text-sm mt-1">{b.description}</div>
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="logs" className="mt-4 space-y-2">
                {task.timeLogs?.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-6">Tiada log masa direkod.</div>
                ) : (
                  <div className="space-y-1.5">
                    {task.timeLogs?.map((l) => (
                      <div key={l.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs">
                        <div>
                          <div className="font-medium">{l.hours} jam</div>
                          {l.note && <div className="text-muted-foreground">{l.note}</div>}
                        </div>
                        <div className="text-muted-foreground">{formatDate(l.date)}</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-2 rounded-md bg-accent/5 border border-accent/20 text-xs font-medium">
                      <span>Jumlah</span>
                      <span className="tabular-nums">{task.timeLogs?.reduce((s, l) => s + l.hours, 0).toFixed(1)} jam / {task.estimatedHours} jam anggaran</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4 space-y-1.5">
                {task.history?.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-6">Tiada sejarah perubahan.</div>
                ) : (
                  task.history?.map((h) => (
                    <div key={h.id} className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{h.note}</div>
                        {h.oldValue && h.newValue && <div className="text-muted-foreground">{h.oldValue} → {h.newValue}</div>}
                        <div className="text-[10px] text-muted-foreground">{formatDateTime(h.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Quality review display if exists */}
            {task.qualityReviews && task.qualityReviews.length > 0 && (
              <div className="px-5 pb-6">
                <div className="p-3 rounded-md bg-status-success/5 border border-status-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-status-warning fill-status-warning" />
                    <span className="text-sm font-semibold">Penilaian Kualiti GM</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Ketepatan", v: task.qualityReviews[0].accuracy },
                      { label: "Kelengkapan", v: task.qualityReviews[0].completeness },
                      { label: "Profesionalisme", v: task.qualityReviews[0].professionalism },
                      { label: "Spesifikasi", v: task.qualityReviews[0].specCompliance },
                    ].map((r) => (
                      <div key={r.label}>
                        <div className="text-lg font-bold tabular-nums">{r.v}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{r.label}</div>
                      </div>
                    ))}
                  </div>
                  {task.qualityReviews[0].comment && (
                    <div className="text-xs text-muted-foreground mt-2 italic">"{task.qualityReviews[0].comment}"</div>
                  )}
                </div>
              </div>
            )}

            {/* Extension requests */}
            {task.extensionRequests && task.extensionRequests.length > 0 && (
              <div className="px-5 pb-6 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permintaan Lanjutan Tarikh</div>
                {task.extensionRequests.map((e) => (
                  <div key={e.id} className={cn("p-2.5 rounded-md border text-xs", e.status === "Diluluskan" ? "border-status-success/30 bg-status-success/5" : e.status === "Ditolak" ? "border-status-danger/30 bg-status-danger/5" : "border-status-warning/30 bg-status-warning/5")}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Lanjutan ke {formatDate(e.requestedDate)}</span>
                      <span className={cn("px-1.5 py-0.5 rounded font-medium", e.status === "Diluluskan" ? "bg-status-success/15 text-status-success" : e.status === "Ditolak" ? "bg-status-danger/15 text-status-danger" : "bg-status-warning/15 text-status-warning")}>{e.status}</span>
                    </div>
                    <div className="text-muted-foreground mt-1">{e.reason}</div>
                    {user.role === "GM" && e.status === "Menunggu" && (
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" className="h-6 text-[10px]" onClick={async () => { await apiPatch(`/api/tasks/${taskId}/extension`, { extensionId: e.id, status: "Diluluskan" }); qc.invalidateQueries({ queryKey: ["task", taskId] }); toast.success("Lanjutan diluluskan."); }}>Lulus</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={async () => { await apiPatch(`/api/tasks/${taskId}/extension`, { extensionId: e.id, status: "Ditolak" }); qc.invalidateQueries({ queryKey: ["task", taskId] }); toast.success("Lanjutan ditolak."); }}>Tolak</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </SheetContent>

      {task && (
        <>
          <BlockerDialog open={blockerOpen} onOpenChange={setBlockerOpen} taskId={taskId} onSaved={() => qc.invalidateQueries({ queryKey: ["task", taskId] })} />
          <TimeLogDialog open={logOpen} onOpenChange={setLogOpen} taskId={taskId} onSaved={() => qc.invalidateQueries({ queryKey: ["task", taskId] })} />
          {user.role === "GM" && (
            <QualityReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} taskId={taskId} onSaved={() => { qc.invalidateQueries({ queryKey: ["task", taskId] }); qc.invalidateQueries({ queryKey: ["tasks"] }); }} />
          )}
          <ExtensionDialog open={extOpen} onOpenChange={setExtOpen} taskId={taskId} onSaved={() => qc.invalidateQueries({ queryKey: ["task", taskId] })} />
        </>
      )}
    </Sheet>
  );
}

function daysUntil(dateStr: string) {
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function BlockerDialog({ open, onOpenChange, taskId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; taskId: string; onSaved: () => void }) {
  const [type, setType] = useState("Teknikal");
  const [description, setDescription] = useState("");
  const [helpNeeded, setHelpNeeded] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan Halangan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Jenis Halangan</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 px-2 text-sm rounded border border-input bg-background w-full">
              {["Maklumat", "Sumber", "Klien", "Teknikal", "Lain"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Penerangan Halangan</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Apakah halangan yang dihadapi?" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bantuan Diperlukan</Label>
            <Input value={helpNeeded} onChange={(e) => setHelpNeeded(e.target.value)} placeholder="Apakah bantuan yang diperlukan?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={async () => {
            await apiPost(`/api/tasks/${taskId}/blockers`, { type, description, helpNeeded });
            onSaved(); onOpenChange(false); setDescription(""); setHelpNeeded("");
            toast.success("Halangan dilaporkan.");
          }}>Laporkan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimeLogDialog({ open, onOpenChange, taskId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; taskId: string; onSaved: () => void }) {
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Masa Kerja</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Jam</Label>
              <Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="2.5" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tarikh</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nota</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan ringkas (pilihan)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={async () => {
            await apiPost(`/api/tasks/${taskId}/time-logs`, { hours: Number(hours), date, note });
            onSaved(); onOpenChange(false); setHours(""); setNote("");
            toast.success("Masa direkod.");
          }}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QualityReviewDialog({ open, onOpenChange, taskId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; taskId: string; onSaved: () => void }) {
  const [ratings, setRatings] = useState({ accuracy: 4, completeness: 4, professionalism: 4, specCompliance: 4 });
  const [comment, setComment] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Penilaian Kualiti &amp; Kelulusan</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {[
            { key: "accuracy", label: "Ketepatan" },
            { key: "completeness", label: "Kelengkapan" },
            { key: "professionalism", label: "Profesionalisme" },
            { key: "specCompliance", label: "Mengikut Spesifikasi" },
          ].map((r) => (
            <div key={r.key} className="flex items-center justify-between">
              <Label className="text-xs">{r.label}</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => setRatings({ ...ratings, [r.key]: v })} className={cn("w-7 h-7 rounded text-xs font-medium transition-colors", v <= (ratings as any)[r.key] ? "bg-status-warning text-white" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Komen</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Maklum balas untuk staf..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={async () => {
            await apiPost(`/api/tasks/${taskId}/review`, { ...ratings, comment });
            onSaved(); onOpenChange(false); setComment("");
            toast.success("Tugasan diluluskan &amp; dinilai.");
          }}><CheckCircle2 className="w-4 h-4 mr-1.5" /> Lulus &amp; Nilai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtensionDialog({ open, onOpenChange, taskId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; taskId: string; onSaved: () => void }) {
  const [requestedDate, setRequestedDate] = useState("");
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Mohon Lanjutan Tarikh Akhir</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Tarikh Akhir Baharu</Label>
            <Input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sebab Permohonan</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Kenapa lanjutan diperlukan?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={async () => {
            await apiPost(`/api/tasks/${taskId}/extension`, { requestedDate, reason });
            onSaved(); onOpenChange(false); setReason("");
            toast.success("Permintaan lanjutan dihantar kepada GM.");
          }}>Hantar Permohonan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
