"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiGet, apiPatch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { initials, formatDate } from "@/lib/meta";

import {
  SectionHeader,
  PageContainer,
  EmptyState,
} from "@/components/common/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  User as UserIcon,
  Palette,
  Save,
  Loader2,
  Mail,
  Calendar,
  Briefcase,
  Clock,
  ShieldCheck,
  Search,
  Check,
} from "lucide-react";

import type { User } from "@/types";

// --- constants -------------------------------------------------------------

const AVATAR_COLORS = [
  "#1F3A5F",
  "#0E7C86",
  "#8B5CF6",
  "#E11D48",
  "#0891B2",
  "#16A34A",
  "#EA580C",
  "#64748B",
];

const ROLE_META: Record<
  User["role"],
  { label: string; text: string; bg: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  GM: {
    label: "GM",
    text: "text-primary-foreground",
    bg: "bg-primary",
    icon: ShieldCheck,
  },
  STAF: {
    label: "STAF",
    text: "text-accent-foreground",
    bg: "bg-accent",
  },
};

interface EditState {
  name: string;
  position: string;
  weeklyHours: number;
  startDate: string; // yyyy-mm-dd
  avatarColor: string;
}

function toEdit(u: User): EditState {
  return {
    name: u.name,
    position: u.position,
    weeklyHours: u.weeklyHours,
    startDate: u.startDate.slice(0, 10),
    avatarColor: u.avatarColor,
  };
}

// --- main view -------------------------------------------------------------

export function ProfileView() {
  const qc = useQueryClient();
  const me = useAppStore((s) => s.user)!;
  const setUser = useAppStore((s) => s.setUser);
  const isGM = me.role === "GM";

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<{ users: User[] }>("/api/users"),
  });

  const users = data?.users ?? [];
  const self = users.find((u) => u.id === me.id) ?? me;

  const [edit, setEdit] = useState<EditState>(toEdit(self));
  const [staffEdits, setStaffEdits] = useState<Record<string, EditState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const roleMeta = ROLE_META[self.role];
  const RoleIcon = roleMeta.icon;

  // Sync self-edit state when self user changes
  useEffect(() => {
    setEdit(toEdit(self));
  }, [
    self.id,
    self.name,
    self.position,
    self.weeklyHours,
    self.startDate,
    self.avatarColor,
  ]);

  // Ensure staffEdits map is populated for every user
  useEffect(() => {
    setStaffEdits((prev) => {
      const next: Record<string, EditState> = {};
      for (const u of users) {
        next[u.id] = prev[u.id] ?? toEdit(u);
      }
      return next;
    });
  }, [users]);

  const selfDirty = JSON.stringify(toEdit(self)) !== JSON.stringify(edit);

  async function saveUser(id: string, e: EditState, isSelf: boolean) {
    const base = isSelf ? self : users.find((u) => u.id === id);
    if (!base) return;

    const payload: Record<string, unknown> = { id };
    if (e.name !== base.name) payload.name = e.name;
    if (e.position !== base.position) payload.position = e.position;
    if (e.weeklyHours !== base.weeklyHours)
      payload.weeklyHours = e.weeklyHours;
    if (e.startDate !== base.startDate.slice(0, 10))
      payload.startDate = e.startDate;
    if (e.avatarColor !== base.avatarColor)
      payload.avatarColor = e.avatarColor;

    setSavingId(id);
    try {
      const res = await apiPatch<{
        user: {
          id: string;
          name: string;
          position: string;
          weeklyHours: number;
          avatarColor: string;
          startDate: string;
        };
      }>("/api/users", payload);

      toast.success(
        isSelf ? "Profil anda dikemas kini." : "Profil staf dikemas kini."
      );
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["performance"] });
      qc.invalidateQueries({ queryKey: ["workload"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });

      if (isSelf) {
        const u = res.user;
        setUser({
          ...self,
          name: u.name,
          position: u.position,
          weeklyHours: u.weeklyHours,
          avatarColor: u.avatarColor,
          startDate: u.startDate ?? self.startDate,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ralat tidak diketahui";
      toast.error("Gagal mengemas kini profil.", { description: msg });
    } finally {
      setSavingId(null);
    }
  }

  function patchSelf() {
    void saveUser(self.id, edit, true);
  }

  const filteredStaff = isGM
    ? users
        .filter((u) => u.id !== self.id)
        .filter((u) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            u.name.toLowerCase().includes(q) ||
            u.position.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
          );
        })
    : [];

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Akaun Saya
          </span>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight mt-0.5 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-accent" />
            Profil Pengguna
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isGM
              ? "Urus profil peribadi dan staf"
              : "Kemas kini maklumat peribadi anda"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile header card */}
          <Card className="lg:col-span-1 p-4 lg:p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar
                className="w-24 h-24 text-2xl font-semibold ring-4 ring-background shadow-sm"
                style={{ backgroundColor: edit.avatarColor }}
              >
                <AvatarFallback
                  className="text-white font-semibold"
                  style={{ backgroundColor: edit.avatarColor }}
                >
                  {initials(self.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">
                {self.name}
              </h2>
              <Badge
                className={cn(
                  "mt-1.5 gap-1",
                  roleMeta.bg,
                  roleMeta.text
                )}
              >
                {RoleIcon ? (
                  <RoleIcon className="w-3 h-3" />
                ) : null}
                {roleMeta.label}
              </Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                {self.position || "Tiada jawatan"}
              </p>
            </div>
            <Separator className="my-4" />
            <dl className="space-y-2.5 text-sm">
              <InfoRow
                icon={Mail}
                label="E-mel"
                value={self.email}
              />
              <InfoRow
                icon={Briefcase}
                label="Jawatan"
                value={self.position || "—"}
              />
              <InfoRow
                icon={Clock}
                label="Jam / Minggu"
                value={`${self.weeklyHours} jam`}
              />
              <InfoRow
                icon={Calendar}
                label="Tarikh Mula"
                value={formatDate(self.startDate)}
              />
              <InfoRow
                icon={UserIcon}
                label="Status"
                value={self.active ? "Aktif" : "Tidak Aktif"}
              />
            </dl>
          </Card>

          {/* Edit form */}
          <Card className="lg:col-span-2 p-4 lg:p-6">
            <SectionHeader
              title="Edit Profil"
              subtitle={
                isGM
                  ? "Anda boleh edit semua medan"
                  : "Anda boleh edit warna avatar dan jawatan (demo)"
              }
              icon={UserIcon}
              action={
                <Button
                  size="sm"
                  onClick={patchSelf}
                  disabled={!selfDirty || savingId === self.id}
                >
                  {savingId === self.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Simpan Perubahan
                </Button>
              }
            />

            {/* Avatar color picker */}
            <div className="space-y-2 mb-5">
              <Label className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Warna Avatar
              </Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((c) => {
                  const selected = edit.avatarColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setEdit((s) => ({ ...s, avatarColor: c }))
                      }
                      aria-label={`Pilih warna ${c}`}
                      aria-pressed={selected}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all flex items-center justify-center border border-black/5",
                        selected
                          ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                          : "hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {selected && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Warna semasa:{" "}
                <span className="font-mono">{edit.avatarColor}</span>
              </p>
            </div>

            <Separator className="mb-5" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Penuh</Label>
                <Input
                  id="name"
                  value={edit.name}
                  disabled={!isGM}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, name: e.target.value }))
                  }
                />
                {!isGM && (
                  <p className="text-[11px] text-muted-foreground">
                    Hanya GM boleh ubah nama.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position">Jawatan</Label>
                <Input
                  id="position"
                  value={edit.position}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, position: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hours">Jam Bekerja / Minggu</Label>
                <Input
                  id="hours"
                  type="number"
                  min={1}
                  max={80}
                  value={edit.weeklyHours}
                  disabled={!isGM}
                  onChange={(e) =>
                    setEdit((s) => ({
                      ...s,
                      weeklyHours: Math.max(1, Number(e.target.value) || 0),
                    }))
                  }
                  className="tabular-nums"
                />
                {!isGM && (
                  <p className="text-[11px] text-muted-foreground">
                    Hanya GM boleh ubah jam bekerja.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Tarikh Mula Bekerja</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={edit.startDate}
                  disabled={!isGM}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, startDate: e.target.value }))
                  }
                />
                {!isGM && (
                  <p className="text-[11px] text-muted-foreground">
                    Hanya GM boleh ubah tarikh mula.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* GM: staff list quick-edit */}
      {isGM && !isLoading && (
        <Card className="p-4 lg:p-6">
          <SectionHeader
            title="Senarai Staf"
            subtitle={`${filteredStaff.length} staf`}
            icon={UserIcon}
            action={
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Cari staf..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8 h-8 w-44 sm:w-56"
                  aria-label="Cari staf"
                />
              </div>
            }
          />
          {filteredStaff.length === 0 ? (
            <EmptyState
              icon={UserIcon}
              title="Tiada staf"
              description={
                query ? "Carian tiada padanan." : "Tiada staf lain didaftarkan."
              }
            />
          ) : (
            <div className="max-h-[640px] overflow-y-auto scroll-slim space-y-2 pr-1">
              {filteredStaff.map((u) => {
                const e = staffEdits[u.id] ?? toEdit(u);
                const dirty =
                  JSON.stringify(toEdit(u)) !== JSON.stringify(e);
                const saving = savingId === u.id;
                return (
                  <div
                    key={u.id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        className="w-10 h-10 shrink-0"
                        style={{ backgroundColor: e.avatarColor }}
                      >
                        <AvatarFallback
                          className="text-white text-xs font-semibold"
                          style={{ backgroundColor: e.avatarColor }}
                        >
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">
                            Nama
                          </Label>
                          <Input
                            value={e.name}
                            onChange={(ev) =>
                              setStaffEdits((p) => ({
                                ...p,
                                [u.id]: { ...e, name: ev.target.value },
                              }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">
                            Jawatan
                          </Label>
                          <Input
                            value={e.position}
                            onChange={(ev) =>
                              setStaffEdits((p) => ({
                                ...p,
                                [u.id]: { ...e, position: ev.target.value },
                              }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">
                            Jam / Minggu
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={80}
                            value={e.weeklyHours}
                            onChange={(ev) =>
                              setStaffEdits((p) => ({
                                ...p,
                                [u.id]: {
                                  ...e,
                                  weeklyHours: Math.max(
                                    1,
                                    Number(ev.target.value) || 0
                                  ),
                                },
                              }))
                            }
                            className="h-8 text-sm tabular-nums"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">
                            Warna
                          </Label>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {AVATAR_COLORS.map((c) => {
                              const selected =
                                e.avatarColor.toLowerCase() === c.toLowerCase();
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  aria-label={`Warna ${c}`}
                                  aria-pressed={selected}
                                  onClick={() =>
                                    setStaffEdits((p) => ({
                                      ...p,
                                      [u.id]: { ...e, avatarColor: c },
                                    }))
                                  }
                                  className={cn(
                                    "w-5 h-5 rounded-full border border-black/5 transition-transform",
                                    selected
                                      ? "ring-2 ring-offset-1 ring-offset-background ring-foreground scale-110"
                                      : "hover:scale-110"
                                  )}
                                  style={{ backgroundColor: c }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={dirty ? "default" : "outline"}
                        disabled={!dirty || saving}
                        onClick={() => saveUser(u.id, e, false)}
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Simpan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </PageContainer>
  );
}

// --- helpers ---------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </dt>
      <dd className="font-medium text-foreground text-sm truncate text-right max-w-[60%]">
        {value}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-6 space-y-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-32 mx-auto bg-muted rounded animate-pulse" />
        <div className="h-3 w-20 mx-auto bg-muted/70 rounded animate-pulse" />
        <div className="h-px bg-border my-2" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted/60 rounded animate-pulse" />
          ))}
        </div>
      </Card>
      <Card className="lg:col-span-2 p-6 space-y-4">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted/60 rounded animate-pulse" />
        <div className="h-px bg-border my-2" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/60 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    </div>
  );
}
