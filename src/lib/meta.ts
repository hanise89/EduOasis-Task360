"use client";

import type { TaskStatus, Priority, WorkloadStatus } from "@/types";

// Status colors per PRD: Green=Selesai/Seimbang, Yellow=Hampir/Tinggi, Red=Lewat/Berlebihan, Blue=Dalam Proses, Grey=Belum Mula
export const TASK_STATUS_META: Record<string, { label: string; color: string; bg: string; text: string; dot: string }> = {
  "Belum Mula": { label: "Belum Mula", color: "neutral", bg: "bg-muted", text: "text-muted-foreground", dot: "bg-status-neutral" },
  "Dalam Proses": { label: "Dalam Proses", color: "info", bg: "bg-status-info/10", text: "text-status-info", dot: "bg-status-info" },
  "Menunggu Semakan": { label: "Menunggu Semakan", color: "warning", bg: "bg-status-warning/15", text: "text-status-warning", dot: "bg-status-warning" },
  "Selesai": { label: "Selesai", color: "success", bg: "bg-status-success/10", text: "text-status-success", dot: "bg-status-success" },
  "Disekat": { label: "Disekat", color: "danger", bg: "bg-status-danger/10", text: "text-status-danger", dot: "bg-status-danger" },
  "Dibatalkan": { label: "Dibatalkan", color: "neutral", bg: "bg-muted", text: "text-muted-foreground", dot: "bg-status-neutral" },
};

export const PRIORITY_META: Record<string, { label: string; text: string; bg: string }> = {
  "Rendah": { label: "Rendah", text: "text-muted-foreground", bg: "bg-muted" },
  "Sederhana": { label: "Sederhana", text: "text-status-info", bg: "bg-status-info/10" },
  "Tinggi": { label: "Tinggi", text: "text-status-warning", bg: "bg-status-warning/15" },
  "Segera": { label: "Segera", text: "text-status-danger", bg: "bg-status-danger/10" },
};

export const WORKLOAD_META: Record<string, { label: string; text: string; bg: string; ring: string }> = {
  "Rendah": { label: "Rendah", text: "text-status-info", bg: "bg-status-info/10", ring: "ring-status-info/20" },
  "Seimbang": { label: "Seimbang", text: "text-status-success", bg: "bg-status-success/10", ring: "ring-status-success/20" },
  "Tinggi": { label: "Tinggi", text: "text-status-warning", bg: "bg-status-warning/15", ring: "ring-status-warning/20" },
  "Beban Berlebihan": { label: "Beban Berlebihan", text: "text-status-danger", bg: "bg-status-danger/10", ring: "ring-status-danger/20" },
};

export const GRADE_META: Record<string, { label: string; text: string; bg: string }> = {
  A: { label: "Cemerlang", text: "text-status-success", bg: "bg-status-success/10" },
  B: { label: "Baik", text: "text-status-success", bg: "bg-status-success/10" },
  C: { label: "Memuaskan", text: "text-status-warning", bg: "bg-status-warning/15" },
  D: { label: "Perlu Penambahbaikan", text: "text-status-danger", bg: "bg-status-danger/10" },
  E: { label: "Kritikal", text: "text-status-danger", bg: "bg-status-danger/10" },
};

export const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  "Latihan": { label: "Latihan", icon: "GraduationCap" },
  "Perundingan": { label: "Perundingan", icon: "Handshake" },
  "Pemasaran": { label: "Pemasaran", icon: "Megaphone" },
  "Pentadbiran": { label: "Pentadbiran", icon: "ClipboardList" },
  "Kewangan": { label: "Kewangan", icon: "Wallet" },
  "Sekolah Berlesen": { label: "Sekolah Berlesen", icon: "School" },
  "Lain": { label: "Lain-lain", icon: "Folder" },
};

export function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ms-MY", opts || { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("ms-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} minit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  return formatDate(dateStr);
}

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
