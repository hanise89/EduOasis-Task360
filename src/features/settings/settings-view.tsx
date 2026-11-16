"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPut, apiPost } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/meta";

import {
  SectionHeader,
  PageContainer,
  EmptyState,
} from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import {
  Settings as SettingsIcon,
  Scale,
  Award,
  Calendar,
  History,
  RotateCcw,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import type { Settings, AuditLog } from "@/types";

// --- constants -------------------------------------------------------------

type WeightKey = keyof Settings["weights"];

const DIMENSIONS: { key: WeightKey; label: string; desc: string }[] = [
  { key: "taskCompletion", label: "Penyiapan Tugasan", desc: "Kadar tugasan diselesaikan mengikut tempoh" },
  { key: "timeliness", label: "Ketepatan Masa", desc: "Pematuhan tarikh akhir & sambungan" },
  { key: "workQuality", label: "Kualiti Kerja", desc: "Skor semakan kualiti GM" },
  { key: "initiative", label: "Inisiatif & Penyelesaian", desc: "Sumbangan di luar tugasan rasmi" },
  { key: "communication", label: "Komunikasi & Akauntabiliti", desc: "Respons komen & pelaporan" },
  { key: "productivity", label: "Produktiviti & Beban", desc: "Penggunaan jam bekerja berkesan" },
];

const DEFAULT_SETTINGS: Settings = {
  weights: {
    taskCompletion: 20,
    timeliness: 15,
    workQuality: 25,
    initiative: 10,
    communication: 15,
    productivity: 15,
  },
  initiativeTargetMonthly: 20,
  initiativeTargetQuarterly: 60,
  gradeBands: {
    A: { min: 90, max: 100 },
    B: { min: 75, max: 89 },
    C: { min: 60, max: 74 },
    D: { min: 40, max: 59 },
    E: { min: 0, max: 39 },
  },
  workingDays: [1, 2, 3, 4, 5],
  holidays: [],
};

const GRADE_LABELS: Record<keyof Settings["gradeBands"], string> = {
  A: "Cemerlang",
  B: "Baik",
  C: "Memuaskan",
  D: "Perlu Penambahbaikan",
  E: "Kritikal",
};

const WEEKDAY_LABELS = [
  "Ahad",
  "Isnin",
  "Selasa",
  "Rabu",
  "Khamis",
  "Jumaat",
  "Sabtu",
];

const ACTION_STYLE_RULES: { match: RegExp; text: string; bg: string }[] = [
  { match: /LOGIN|LOGOUT|AUTH|SESSION/i, text: "text-muted-foreground", bg: "bg-muted" },
  { match: /CREATE|ADD|SUBMIT|REGISTER|UPLOADED/i, text: "text-status-info", bg: "bg-status-info/10" },
  { match: /UPDATE|PATCH|EDIT|REVIEW|VERIFY|CHANGE|EXTEND|ASSIGN|REWORK|PROGRESS|TIME_LOG/i, text: "text-accent", bg: "bg-accent/10" },
  { match: /DELETE|REMOVE|RESET|PURGE|CLEAR/i, text: "text-status-danger", bg: "bg-status-danger/10" },
  { match: /APPROVE|CONFIRM|COMPLETE|DONE|RESOLVE|CLOSE/i, text: "text-status-success", bg: "bg-status-success/10" },
  { match: /REJECT|DECLINE|CANCEL|BLOCK|FAIL/i, text: "text-status-warning", bg: "bg-status-warning/15" },
];

function actionStyle(action: string): { text: string; bg: string } {
  const found = ACTION_STYLE_RULES.find((r) => r.match.test(action));
  return found ?? { text: "text-muted-foreground", bg: "bg-muted" };
}

// --- main view -------------------------------------------------------------

export function SettingsView() {
  const [tab, setTab] = useState("weights");

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-3 flex-wrap pb-4 border-b border-border">
        <div>
          <span className="eyebrow">Tetapan Sistem</span>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-1 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-accent" />
            Tetapan & Konfigurasi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Urus pemberat dimensi, sasaran, gred, dan data sistem
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto h-auto sm:h-9 rounded-sm bg-muted/30 border border-border p-0.5">
          <TabsTrigger value="weights" className="gap-1.5 rounded-sm">
            <Scale className="w-3.5 h-3.5" />
            Pemberat Dimensi
          </TabsTrigger>
          <TabsTrigger value="targets" className="gap-1.5 rounded-sm">
            <Award className="w-3.5 h-3.5" />
            Sasaran &amp; Gred
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 rounded-sm">
            <History className="w-3.5 h-3.5" />
            Log Audit &amp; Set Semula
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weights" className="mt-4 outline-none">
          <WeightsTab />
        </TabsContent>
        <TabsContent value="targets" className="mt-4 outline-none">
          <TargetsTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4 outline-none">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// --- Tab 1: Weights -------------------------------------------------------

function WeightsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<{ settings: Settings }>("/api/settings"),
  });

  const [weights, setWeights] = useState<Settings["weights"]>(
    DEFAULT_SETTINGS.weights
  );
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (data?.settings?.weights) {
      setWeights(data.settings.weights);
      setHydrated(true);
    }
  }, [data]);

  const total = useMemo(
    () =>
      Object.values(weights).reduce(
        (sum, v) => sum + (Number(v) || 0),
        0
      ),
    [weights]
  );

  const valid = Math.abs(total - 100) <= 0.5;
  const dirty =
    !hydrated ||
    JSON.stringify(data?.settings?.weights ?? DEFAULT_SETTINGS.weights) !==
      JSON.stringify(weights);

  async function handleSave() {
    if (!valid) {
      toast.error("Jumlah pemberat mesti 100%.", {
        description: `Kini ${total}%.`,
      });
      return;
    }
    setSaving(true);
    try {
      const payload: Settings = {
        ...(data?.settings ?? DEFAULT_SETTINGS),
        weights,
      };
      const res = await apiPut<{ settings: Settings }>(
        "/api/settings",
        payload
      );
      setWeights(res.settings.weights);
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["performance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Pemberat dimensi disimpan.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ralat tidak diketahui";
      toast.error("Gagal menyimpan pemberat.", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <WeightsSkeleton />;

  return (
    <Card className="p-4 lg:p-6 card-flat rounded-md">
      <SectionHeader
        title="Pemberat Dimensi Prestasi"
        eyebrow="Pemberat & Sasaran"
        index="01"
        subtitle="Jumlah pemberat keenam-enam dimensi mesti 100%"
        icon={Scale}
        action={
          <Button
            size="sm"
            className="rounded-sm"
            onClick={handleSave}
            disabled={!valid || saving || !dirty}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Pemberat
          </Button>
        }
      />

      {/* Total bar */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-sm border px-4 py-3 mb-4",
          valid ? "border-border bg-muted/40" : "border-status-danger/30 bg-status-danger/5"
        )}
      >
        <div className="flex items-center gap-2">
          {valid ? (
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-status-danger" />
          )}
          <span className="eyebrow">Jumlah Pemberat</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-2xl font-semibold num-display tabular-nums",
              valid ? "text-foreground" : "text-status-danger"
            )}
          >
            {total}%
          </span>
          <Badge variant={valid ? "secondary" : "destructive"} className="rounded-sm">
            {valid ? "Sah" : `Baki ${100 - total}%`}
          </Badge>
        </div>
      </div>

      {!valid && (
        <div className="flex items-start gap-2 rounded-sm bg-status-danger/10 border border-status-danger/20 px-3 py-2 mb-4 text-xs text-status-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Jumlah pemberat kini <strong className="tabular-nums">{total}%</strong>. Laraskan supaya
            berjumlah 100% untuk membolehkan butang Simpan.
          </span>
        </div>
      )}

      <div className="space-y-5">
        {DIMENSIONS.map((d, i) => {
          const val = Number(weights[d.key]) || 0;
          return (
            <div
              key={d.key}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4 items-start sm:items-center hairline-t border-border pt-4 first:border-0 first:pt-0"
            >
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="index-numeral text-xs">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <div className="eyebrow">{d.label}</div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {d.desc}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums num-display text-accent shrink-0">
                    {val}%
                  </span>
                </div>
                <Slider
                  value={[val]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) =>
                    setWeights((w) => ({ ...w, [d.key]: v[0] ?? 0 }))
                  }
                  className="w-full"
                  aria-label={d.label}
                />
              </div>
              <div className="flex items-center gap-2 sm:w-28">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) =>
                    setWeights((w) => ({
                      ...w,
                      [d.key]: Math.max(
                        0,
                        Math.min(100, Number(e.target.value) || 0)
                      ),
                    }))
                  }
                  className="text-right tabular-nums rounded-sm"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// --- Tab 2: Targets & Grades ----------------------------------------------

function TargetsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<{ settings: Settings }>("/api/settings"),
  });

  const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [newHoliday, setNewHoliday] = useState("");

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings);
      setHydrated(true);
    }
  }, [data]);

  const dirty =
    !hydrated ||
    JSON.stringify(data?.settings ?? DEFAULT_SETTINGS) !== JSON.stringify(form);

  function setField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setGrade(
    grade: keyof Settings["gradeBands"],
    field: "min" | "max",
    value: number
  ) {
    setForm((f) => ({
      ...f,
      gradeBands: {
        ...f.gradeBands,
        [grade]: { ...f.gradeBands[grade], [field]: value },
      },
    }));
  }

  function toggleWorkingDay(day: number) {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day].sort((a, b) => a - b),
    }));
  }

  function addHoliday() {
    if (!newHoliday) return;
    if (form.holidays.includes(newHoliday)) {
      toast.error("Tarikh cuti sudah wujud dalam senarai.");
      return;
    }
    setForm((f) => ({
      ...f,
      holidays: [...f.holidays, newHoliday].sort(),
    }));
    setNewHoliday("");
  }

  function removeHoliday(date: string) {
    setForm((f) => ({
      ...f,
      holidays: f.holidays.filter((d) => d !== date),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiPut<{ settings: Settings }>("/api/settings", form);
      setForm(res.settings);
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["performance"] });
      qc.invalidateQueries({ queryKey: ["workload"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Tetapan sasaran & gred disimpan.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ralat tidak diketahui";
      toast.error("Gagal menyimpan tetapan.", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <TargetsSkeleton />;

  return (
    <div className="space-y-4">
      {/* Initiative targets */}
      <Card className="p-4 lg:p-6 card-flat rounded-md">
        <SectionHeader
          title="Sasaran Inisiatif"
          eyebrow="Kategori & Sasaran"
          index="02"
          subtitle="Sasaran mata inisiatif bulanan & suku tahunan"
          icon={Award}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="eyebrow" htmlFor="monthly-target">Sasaran Bulanan (mata)</Label>
            <Input
              id="monthly-target"
              type="number"
              min={0}
              max={200}
              value={form.initiativeTargetMonthly}
              onChange={(e) =>
                setField(
                  "initiativeTargetMonthly",
                  Math.max(0, Number(e.target.value) || 0)
                )
              }
              className="tabular-nums num-display rounded-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum mata inisiatif setiap staf sebulan
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="eyebrow" htmlFor="quarterly-target">Sasaran Suku Tahunan (mata)</Label>
            <Input
              id="quarterly-target"
              type="number"
              min={0}
              max={500}
              value={form.initiativeTargetQuarterly}
              onChange={(e) =>
                setField(
                  "initiativeTargetQuarterly",
                  Math.max(0, Number(e.target.value) || 0)
                )
              }
              className="tabular-nums num-display rounded-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum mata inisiatif setiap staf setiap suku tahun
            </p>
          </div>
        </div>
      </Card>

      {/* Grade bands */}
      <Card className="p-4 lg:p-6 card-flat rounded-md">
        <SectionHeader
          title="Julat Gred Prestasi"
          eyebrow="Gred"
          index="03"
          subtitle="Takrif julat markah bagi setiap gred (0-100)"
          icon={Award}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(
            Object.keys(form.gradeBands) as (keyof Settings["gradeBands"])[]
          ).map((g, idx) => {
            const band = form.gradeBands[g];
            const tone =
              g === "A" || g === "B"
                ? "bg-status-success/10 text-status-success"
                : g === "C"
                  ? "bg-status-warning/15 text-status-warning"
                  : "bg-status-danger/10 text-status-danger";
            return (
              <div
                key={g}
                className="rounded-sm border border-border p-3 bg-muted/20 card-flat"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-7 h-7 rounded-sm flex items-center justify-center text-sm font-semibold border border-border tabular-nums",
                        tone
                      )}
                    >
                      {g}
                    </span>
                    <span className="text-sm font-medium">
                      {GRADE_LABELS[g]}
                    </span>
                  </div>
                  <span className="eyebrow tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="eyebrow">
                      Minimum
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={band.min}
                      onChange={(e) =>
                        setGrade(
                          g,
                          "min",
                          Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 0)
                          )
                        )
                      }
                      className="tabular-nums rounded-sm"
                    />
                  </div>
                  <div>
                    <Label className="eyebrow">
                      Maksimum
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={band.max}
                      onChange={(e) =>
                        setGrade(
                          g,
                          "max",
                          Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 0)
                          )
                        )
                      }
                      className="tabular-nums rounded-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Working days & holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 lg:p-6 card-flat rounded-md">
          <SectionHeader
            title="Hari Bekerja"
            eyebrow="Kalendar"
            index="04"
            subtitle="Pilih hari bekerja mingguan"
            icon={Calendar}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WEEKDAY_LABELS.map((label, idx) => {
              const checked = form.workingDays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleWorkingDay(idx)}
                  aria-pressed={checked}
                  className={cn(
                    "rounded-sm border px-3 py-2 cursor-pointer transition-colors text-sm select-none flex items-center gap-2 justify-center",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 bg-background"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleWorkingDay(idx)}
                    className="pointer-events-none"
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 lg:p-6 card-flat rounded-md">
          <SectionHeader
            title="Hari Cuti"
            eyebrow="Kalendar"
            index="05"
            subtitle="Tarikh cuti dikecualikan daripada pengiraan"
            icon={Calendar}
          />
          <div className="flex items-end gap-2 mb-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-holiday" className="sr-only">
                Tambah hari cuti
              </Label>
              <Input
                id="new-holiday"
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                className="rounded-sm"
              />
            </div>
            <Button
              variant="secondary"
              className="rounded-sm"
              onClick={addHoliday}
              disabled={!newHoliday}
            >
              <Plus className="w-4 h-4" />
              Tambah
            </Button>
          </div>
          <Separator className="mb-3 bg-border" />
          {form.holidays.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Tiada hari cuti"
              description="Tambah tarikh cuti di atas."
            />
          ) : (
            <ul className="max-h-64 overflow-y-auto scroll-slim space-y-1.5 pr-1">
              {form.holidays.map((d) => (
                <li
                  key={d}
                  className="flex items-center justify-between rounded-sm border border-border bg-background px-3 py-2 text-sm hairline-b"
                >
                  <span className="tabular-nums">
                    {formatDate(d + "T00:00:00", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-status-danger rounded-sm"
                    onClick={() => removeHoliday(d)}
                    aria-label={`Buang cuti ${d}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleSave} disabled={saving || !dirty} className="rounded-sm">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}

// --- Tab 3: Audit & Reset -------------------------------------------------

function AuditTab() {
  const qc = useQueryClient();
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => apiGet<{ logs: AuditLog[] }>("/api/audit"),
  });

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      const res = await apiPost<{ ok: boolean; message: string }>(
        "/api/settings/reset"
      );
      toast.success(res.message || "Data demo telah diset semula.");
      setResetOpen(false);
      qc.invalidateQueries();
      // Full reload to re-establish session after seed reset
      setTimeout(() => window.location.reload(), 900);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ralat tidak diketahui";
      toast.error("Gagal set semula data.", { description: msg });
    } finally {
      setResetting(false);
    }
  }

  const logs = auditData?.logs ?? [];

  return (
    <div className="space-y-4">
      {/* Audit log */}
      <Card className="p-4 lg:p-6 card-flat rounded-md">
        <SectionHeader
          title="Log Audit"
          eyebrow="Log Audit"
          index="06"
          subtitle="Rekod aktiviti terkini sistem (100 rekod terakhir)"
          icon={History}
        />
        {auditLoading ? (
          <AuditSkeleton />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="Tiada log audit"
            description="Aktiviti sistem akan dipaparkan di sini."
          />
        ) : (
          <div className="max-h-[520px] overflow-y-auto scroll-slim rounded-md border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur z-10">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-36 eyebrow">Masa</TableHead>
                  <TableHead className="w-40 eyebrow">Pelaku</TableHead>
                  <TableHead className="w-44 eyebrow">Tindakan</TableHead>
                  <TableHead className="w-28 eyebrow">Entiti</TableHead>
                  <TableHead className="eyebrow">Butiran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const style = actionStyle(log.action);
                  return (
                    <TableRow key={log.id} className="border-b border-border/50">
                      <TableCell className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {log.actorName || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border border-border",
                            style.bg,
                            style.text
                          )}
                        >
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.entity}
                      </TableCell>
                      <TableCell
                        className="text-xs text-muted-foreground max-w-md truncate"
                        title={log.detail}
                      >
                        {log.detail || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Reset danger card — at bottom with warning alert above */}
      <Card className="p-4 lg:p-6 border-status-danger/30 card-flat rounded-md">
        <SectionHeader
          title="Set Semula Data Demo"
          eyebrow="Pentadbiran Bahaya"
          index="07"
          subtitle="Pulihkan semua data keadaan demo asal"
          icon={RotateCcw}
        />
        <div className="flex items-start gap-2 rounded-sm bg-status-danger/10 border border-status-danger/30 px-3 py-2 mb-4 text-xs text-status-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Amaran:</strong> Tindakan ini akan memadam semua data semasa dan tidak boleh diundur.
            Pastikan anda telah menyandarkan data penting sebelum meneruskan.
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-sm bg-status-danger/5 border border-status-danger/20 px-4 py-3">
          <div className="flex items-start gap-2 text-sm">
            <ShieldAlert className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Tindakan ini akan memadam semua data semasa
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Semua pengguna, tugasan, inisiatif, dan log akan digantikan
                dengan data demo asal. Tindakan ini tidak boleh diundur.
              </p>
            </div>
          </div>
          <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="shrink-0 rounded-sm border border-status-danger/40">
                <RotateCcw className="w-4 h-4" />
                Set Semula Data Demo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-status-danger" />
                  Sahkan Set Semula Data
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Adakah anda pasti? Semua data semasa (pengguna, tugasan,
                  inisiatif, prestasi, log) akan digantikan dengan data demo
                  asal. Tindakan ini{" "}
                  <strong>tidak boleh diundur</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={resetting} className="rounded-sm">Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void handleReset();
                  }}
                  disabled={resetting}
                  className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 rounded-sm"
                >
                  {resetting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Ya, Set Semula
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
}

// --- Skeletons ------------------------------------------------------------

function WeightsSkeleton() {
  return (
    <Card className="p-4 lg:p-6">
      <div className="h-6 w-64 bg-muted rounded animate-pulse mb-4" />
      <div className="h-16 bg-muted/60 rounded animate-pulse mb-4" />
      <div className="space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted/60 rounded animate-pulse" />
        ))}
      </div>
    </Card>
  );
}

function TargetsSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-4 lg:p-6">
        <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="h-20 bg-muted/60 rounded animate-pulse" />
      </Card>
      <Card className="p-4 lg:p-6">
        <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="h-40 bg-muted/60 rounded animate-pulse" />
      </Card>
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 bg-muted/60 rounded animate-pulse" />
      ))}
    </div>
  );
}
