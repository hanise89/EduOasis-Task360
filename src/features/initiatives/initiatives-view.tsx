"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { initials, relativeTime, formatDate } from "@/lib/meta";

import {
  SectionHeader,
  LoadingCard,
  EmptyState,
  PageContainer,
} from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Lightbulb,
  Plus,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Trophy,
  Paperclip,
  Trash2,
  Loader2,
  Send,
  FileText,
  Target,
  Rocket,
} from "lucide-react";

import type { Initiative } from "@/types";

// ---- Types ----------------------------------------------------------------

interface InitiativeUser {
  id: string;
  name: string;
  position: string;
  avatarColor: string;
}

interface InitiativeWithUser extends Initiative {
  user?: InitiativeUser;
}

type StatusFilter = "all" | "Dihantar" | "Disahkan" | "Ditolak";
type ImpactLevel = "Kecil" | "Sederhana" | "Besar";

// ---- Meta -----------------------------------------------------------------

const POINTS: Record<ImpactLevel, number> = { Kecil: 5, Sederhana: 10, Besar: 20 };

const IMPACT_META: Record<ImpactLevel, { label: string; text: string; bg: string; dot: string }> = {
  Kecil: { label: "Kecil", text: "text-muted-foreground", bg: "bg-muted", dot: "bg-status-neutral" },
  Sederhana: { label: "Sederhana", text: "text-status-warning", bg: "bg-status-warning/15", dot: "bg-status-warning" },
  Besar: { label: "Besar", text: "text-status-success", bg: "bg-status-success/10", dot: "bg-status-success" },
};

const INITIATIVE_STATUS_META: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  Dihantar: { label: "Dihantar", text: "text-status-warning", bg: "bg-status-warning/15", dot: "bg-status-warning" },
  Disahkan: { label: "Disahkan", text: "text-status-success", bg: "bg-status-success/10", dot: "bg-status-success" },
  Ditolak: { label: "Ditolak", text: "text-status-danger", bg: "bg-status-danger/10", dot: "bg-status-danger" },
};

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "Dihantar", label: "Dihantar" },
  { key: "Disahkan", label: "Disahkan" },
  { key: "Ditolak", label: "Ditolak" },
];

// ---- Main View ------------------------------------------------------------

export function InitiativesView() {
  const user = useAppStore((s) => s.user)!;
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["initiatives"] });
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sumbangan Tambahan
          </span>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-0.5">
            Inisiatif &amp; Penyelesaian Masalah
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sumbangan di luar tugasan rasmi
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Hantar Inisiatif
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-muted/60 border border-border overflow-x-auto max-w-full">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap",
              statusFilter === f.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* KPI summary */}
      <InitiativeKPIs />

      {/* Initiative list */}
      <InitiativeList
        statusFilter={statusFilter}
        currentUserId={user.id}
        isGM={user.role === "GM"}
        onMutated={invalidateAll}
      />

      {/* Wall */}
      <InitiativeWall />

      {/* Create dialog */}
      <CreateInitiativeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={invalidateAll}
      />
    </PageContainer>
  );
}

// ---- KPI cards ------------------------------------------------------------

function InitiativeKPIs() {
  const { data, isLoading } = useQuery({
    queryKey: ["initiatives", "all"],
    queryFn: () =>
      apiGet<{ initiatives: InitiativeWithUser[] }>("/api/initiatives?status=all"),
  });

  const all = data?.initiatives || [];
  const total = all.length;
  const confirmedPoints = all
    .filter((i) => i.status === "Disahkan")
    .reduce((sum, i) => sum + (i.points || 0), 0);
  const pending = all.filter((i) => i.status === "Dihantar").length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  const cards = [
    {
      label: "Jumlah Inisiatif",
      value: total,
      icon: Lightbulb,
      accent: "text-accent",
      bg: "bg-accent/10",
      hint: "Semua rekod",
    },
    {
      label: "Mata Disahkan",
      value: confirmedPoints,
      icon: Award,
      accent: "text-status-success",
      bg: "bg-status-success/10",
      hint: "Jumlah mata diperoleh",
    },
    {
      label: "Menunggu Pengesahan",
      value: pending,
      icon: Clock,
      accent: "text-status-warning",
      bg: "bg-status-warning/15",
      hint: "Status Dihantar",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                {c.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{c.hint}</div>
            </div>
            <div className={cn("w-9 h-9 rounded-md flex items-center justify-center shrink-0", c.bg)}>
              <c.icon className={cn("w-5 h-5", c.accent)} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---- Initiative list ------------------------------------------------------

function InitiativeList({
  statusFilter,
  currentUserId,
  isGM,
  onMutated,
}: {
  statusFilter: StatusFilter;
  currentUserId: string;
  isGM: boolean;
  onMutated: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["initiatives", statusFilter],
    queryFn: () =>
      apiGet<{ initiatives: InitiativeWithUser[] }>(
        `/api/initiatives?status=${statusFilter}`
      ),
  });

  const initiatives = data?.initiatives || [];

  return (
    <Card className="p-4 lg:p-5">
      <SectionHeader
        title="Senarai Inisiatif"
        subtitle={
          statusFilter === "all"
            ? "Semua inisiatif"
            : `Tapisan: ${statusFilter}`
        }
        icon={FileText}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-md border border-border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : initiatives.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Tiada inisiatif"
          description="Inisiatif yang dihantar akan dipaparkan di sini untuk pengesahan GM."
        />
      ) : (
        <div className="space-y-3 max-h-[640px] overflow-y-auto scroll-slim pr-1">
          <AnimatePresence initial={false}>
            {initiatives.map((init) => (
              <motion.div
                key={init.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <InitiativeCard
                  initiative={init}
                  currentUserId={currentUserId}
                  isGM={isGM}
                  onMutated={onMutated}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}

function InitiativeCard({
  initiative,
  currentUserId,
  isGM,
  onMutated,
}: {
  initiative: InitiativeWithUser;
  currentUserId: string;
  isGM: boolean;
  onMutated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusMeta = INITIATIVE_STATUS_META[initiative.status] || INITIATIVE_STATUS_META.Dihantar;
  const impact = initiative.impactLevel as ImpactLevel;
  const impactMeta = IMPACT_META[impact];
  const owner = initiative.user;
  const ownerName = owner?.name || "Staf";
  const ownerPosition = owner?.position || "";
  const avatarColor = owner?.avatarColor || "#1F3A5F";

  const isOwn = initiative.userId === currentUserId;
  const canVerify = isGM && initiative.status === "Dihantar";

  const hasDetails = Boolean(initiative.problem || initiative.action || initiative.outcome);

  return (
    <div className="rounded-md border border-border bg-background hover:border-accent/30 transition-colors">
      {/* Card header */}
      <div className="flex items-start gap-3 p-3 lg:p-4">
        <Avatar className="w-9 h-9 shrink-0" style={{ backgroundColor: avatarColor }}>
          <AvatarFallback
            className="text-white text-xs font-semibold"
            style={{ backgroundColor: avatarColor }}
          >
            {initials(ownerName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-semibold truncate">{initiative.title}</h3>
                {isOwn && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                    Anda
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">{ownerName}</span>
                {ownerPosition && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{ownerPosition}</span>
                  </>
                )}
                <span aria-hidden>·</span>
                <span>{relativeTime(initiative.submittedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
                  statusMeta.bg,
                  statusMeta.text
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", statusMeta.dot)} />
                {statusMeta.label}
              </span>
              {initiative.status === "Disahkan" && impactMeta && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
                    impactMeta.bg,
                    impactMeta.text
                  )}
                  title={`Impak ${impactMeta.label} = ${POINTS[impact]} mata`}
                >
                  <Sparkles className="w-3 h-3" />
                  {impactMeta.label} · {initiative.points} mata
                </span>
              )}
            </div>
          </div>

          {/* Outcome preview */}
          {initiative.outcome && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {initiative.outcome}
            </p>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {hasDetails && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                {expanded ? "Tutup butiran" : "Lihat butiran"}
              </button>
            )}
            {initiative.evidenceLinks && initiative.evidenceLinks.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {initiative.evidenceLinks.slice(0, 2).map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors max-w-[180px] truncate"
                    title={link}
                  >
                    <Paperclip className="w-3 h-3 shrink-0" />
                    <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                  </a>
                ))}
                {initiative.evidenceLinks.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{initiative.evidenceLinks.length - 2} lagi
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 lg:px-4 pb-3 lg:pb-4 pt-1 grid grid-cols-1 gap-2.5">
              <DetailRow icon={Target} label="Masalah" text={initiative.problem} />
              <DetailRow icon={Rocket} label="Tindakan" text={initiative.action} />
              <DetailRow icon={Award} label="Hasil" text={initiative.outcome} />
              {initiative.verifiedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  Disahkan pada {formatDate(initiative.verifiedAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              {initiative.gmComment && (
                <div className="mt-1 p-2.5 rounded-md bg-muted/50 border border-border">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Komen GM
                  </div>
                  <p className="text-xs text-foreground/90">{initiative.gmComment}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verify form (GM + Dihantar) */}
      {canVerify && (
        <VerifyForm initiative={initiative} onDone={onMutated} />
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text?: string;
}) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <p className="text-xs text-foreground/90 mt-0.5 whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

// ---- Verify form ----------------------------------------------------------

function VerifyForm({
  initiative,
  onDone,
}: {
  initiative: InitiativeWithUser;
  onDone: () => void;
}) {
  const [impact, setImpact] = useState<ImpactLevel>("Sederhana");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState<"Disahkan" | "Ditolak" | null>(null);

  const handleVerify = async (status: "Disahkan" | "Ditolak") => {
    setSubmitting(status);
    try {
      await apiPatch(`/api/initiatives/${initiative.id}/verify`, {
        status,
        impactLevel: status === "Disahkan" ? impact : initiative.impactLevel,
        gmComment: comment.trim(),
      });
      toast.success(
        status === "Disahkan"
          ? `Inisiatif disahkan (${POINTS[impact]} mata).`
          : "Inisiatif ditolak."
      );
      setComment("");
      onDone();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengesahkan inisiatif.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="border-t border-border bg-muted/20 p-3 lg:p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
        <Award className="w-3.5 h-3.5 text-accent" />
        Pengesahan GM
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tahap Impak</Label>
          <Select value={impact} onValueChange={(v) => setImpact(v as ImpactLevel)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(POINTS) as ImpactLevel[]).map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {lvl} · {POINTS[lvl]} mata
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Komen GM (pilihan)</Label>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contoh: Inisiatif yang baik..."
            className="h-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Button
          size="sm"
          onClick={() => handleVerify("Disahkan")}
          disabled={submitting !== null}
        >
          {submitting === "Disahkan" ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-1" />
          )}
          Sahkan
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleVerify("Ditolak")}
          disabled={submitting !== null}
        >
          {submitting === "Ditolak" ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4 mr-1" />
          )}
          Tolak
        </Button>
      </div>
    </div>
  );
}

// ---- Initiative wall ------------------------------------------------------

function InitiativeWall() {
  const { data, isLoading } = useQuery({
    queryKey: ["initiatives", "Disahkan"],
    queryFn: () =>
      apiGet<{ initiatives: InitiativeWithUser[] }>("/api/initiatives?status=Disahkan"),
  });

  const confirmed = data?.initiatives || [];

  return (
    <Card className="overflow-hidden">
      {/* Celebratory header */}
      <div className="bg-gradient-to-r from-accent to-[#1F3A5F] px-4 lg:px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Dinding Inisiatif
            </h2>
            <p className="text-xs text-white/80">
              Pengiktirafan untuk sumbangan luar biasa pasukan
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-md border border-border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : confirmed.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Dinding masih kosong"
            description="Inisiatif yang disahkan oleh GM akan dipaparkan di sini sebagai pengiktirafan."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto scroll-slim pr-1">
            {confirmed.map((init, idx) => (
              <WallCard key={init.id} initiative={init} index={idx} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function WallCard({
  initiative,
  index,
}: {
  initiative: InitiativeWithUser;
  index: number;
}) {
  const owner = initiative.user;
  const ownerName = owner?.name || "Staf";
  const avatarColor = owner?.avatarColor || "#1F3A5F";
  const impact = initiative.impactLevel as ImpactLevel;
  const impactMeta = IMPACT_META[impact];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.4) }}
      className="relative rounded-md border border-border bg-background p-3.5 hover:border-accent/40 hover:shadow-sm transition-all"
    >
      {/* Decorative star */}
      <div className="absolute top-2 right-2 text-accent/15">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex items-start gap-2.5">
        <Avatar className="w-9 h-9 shrink-0" style={{ backgroundColor: avatarColor }}>
          <AvatarFallback
            className="text-white text-xs font-semibold"
            style={{ backgroundColor: avatarColor }}
          >
            {initials(ownerName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{ownerName}</div>
          {owner?.position && (
            <div className="text-[11px] text-muted-foreground truncate">
              {owner.position}
            </div>
          )}
        </div>
      </div>

      <h4 className="text-sm font-medium mt-2.5 leading-snug line-clamp-2">
        {initiative.title}
      </h4>

      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            impactMeta?.bg,
            impactMeta?.text
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", impactMeta?.dot)} />
          {impactMeta?.label}
        </span>
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-semibold tabular-nums text-accent">
            {initiative.points}
          </span>
          <span className="text-[10px] text-muted-foreground">mata</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Create dialog --------------------------------------------------------

function CreateInitiativeDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setProblem("");
    setAction("");
    setOutcome("");
    setLinks([""]);
  };

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const addLink = () => setLinks((l) => [...l, ""]);
  const updateLink = (i: number, v: string) =>
    setLinks((l) => l.map((link, idx) => (idx === i ? v : link)));
  const removeLink = (i: number) =>
    setLinks((l) => (l.length > 1 ? l.filter((_, idx) => idx !== i) : l));

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Sila isi tajuk inisiatif.");
      return;
    }
    setSubmitting(true);
    try {
      const evidenceLinks = links.map((l) => l.trim()).filter(Boolean);
      await apiPost("/api/initiatives", {
        title: title.trim(),
        problem: problem.trim(),
        action: action.trim(),
        outcome: outcome.trim(),
        evidenceLinks,
      });
      toast.success("Inisiatif dihantar untuk pengesahan GM.");
      handleClose(false);
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghantar inisiatif.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scroll-slim">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            Hantar Inisiatif Baharu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Tajuk Inisiatif <span className="text-status-danger">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Automasi laporan mingguan jualan"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Masalah / Pencabar</Label>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Apakah masalah yang dikenal pasti?"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tindakan</Label>
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Langkah yang diambil..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Hasil / Outcome</Label>
            <Textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="Apakah hasil yang dicapai?"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Pautan Bukti (pilihan)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={addLink}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah pautan
              </Button>
            </div>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    value={link}
                    onChange={(e) => updateLink(i, e.target.value)}
                    placeholder="https://..."
                    className="h-9"
                  />
                  {links.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-status-danger"
                      onClick={() => removeLink(i)}
                      aria-label="Buang pautan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Hantar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
