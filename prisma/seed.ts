import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Relative date helpers (dates relative to today so dashboard always feels "live")
const now = new Date();
const DAY = 24 * 60 * 60 * 1000;
function daysAgo(n: number) { return new Date(now.getTime() - n * DAY); }
function daysAhead(n: number) { return new Date(now.getTime() + n * DAY); }
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

// ============================================================
// USERS: 1 GM + 6 staff
// ============================================================
const USERS = [
  { id: "u-gm", email: "rohana@eduoasis.my", password: "demo123", name: "Puan Rohana Abdullah", role: "GM", position: "General Manager", weeklyHours: 40, avatarColor: "#1F3A5F", startDate: daysAgo(900), active: true },
  { id: "u-aish", email: "aisyah@eduoasis.my", password: "demo123", name: "Aisyah Rahman", role: "STAF", position: "Eksekutif Program Latihan", weeklyHours: 40, avatarColor: "#0E7C86", startDate: daysAgo(540), active: true },
  { id: "u-hafiz", email: "hafiz@eduoasis.my", password: "demo123", name: "Muhammad Hafiz Ismail", role: "STAF", position: "Perunding Junior", weeklyHours: 40, avatarColor: "#8B5CF6", startDate: daysAgo(400), active: true },
  { id: "u-nurul", email: "nurul@eduoasis.my", password: "demo123", name: "Nurul Huda Hassan", role: "STAF", position: "Pegawai Pemasaran", weeklyHours: 40, avatarColor: "#E11D48", startDate: daysAgo(320), active: true },
  { id: "u-faizal", email: "faizal@eduoasis.my", password: "demo123", name: "Faizal Karim", role: "STAF", position: "Pereka Modul Latihan", weeklyHours: 40, avatarColor: "#0891B2", startDate: daysAgo(260), active: true },
  { id: "u-zulaikha", email: "zulaikha@eduoasis.my", password: "demo123", name: "Siti Zulaikha Omar", role: "STAF", position: "Pegawai Pentadbiran & Kewangan", weeklyHours: 40, avatarColor: "#16A34A", startDate: daysAgo(200), active: true },
  { id: "u-weiming", email: "weiming@eduoasis.my", password: "demo123", name: "Tan Wei Ming", role: "STAF", position: "Penyelaras Klien", weeklyHours: 40, avatarColor: "#EA580C", startDate: daysAgo(150), active: true },
];

const GM_ID = "u-gm";
const STAFF_IDS = ["u-aish", "u-hafiz", "u-nurul", "u-faizal", "u-zulaikha", "u-weiming"];

const CATEGORIES = ["Latihan", "Perundingan", "Pemasaran", "Pentadbiran", "Kewangan", "Sekolah Berlesen", "Lain"];
const PRIORITIES = ["Rendah", "Sederhana", "Tinggi", "Segera"];

// ============================================================
// TASK SEED: ~70 tasks across 3 months with varied profiles
// ============================================================
type TaskSeed = {
  id: string; title: string; description: string; assigneeId: string; category: string;
  priority: string; status: string; progress: number; complexity: number; estimatedHours: number;
  startOffset: number; dueOffset: number; completedOffset?: number; reworkCount: number; links: string[];
};

// Helper to build task quickly
let taskCounter = 0;
function t(
  assigneeId: string,
  title: string,
  opts: Partial<TaskSeed> = {}
): TaskSeed {
  taskCounter++;
  const category = opts.category || CATEGORIES[taskCounter % CATEGORIES.length];
  const priority = opts.priority || PRIORITIES[taskCounter % 3];
  const status = opts.status || "Selesai";
  const complexity = opts.complexity ?? (taskCounter % 3) + 1;
  const startOffset = opts.startOffset ?? 80 - (taskCounter % 30);
  const dueOffset = opts.dueOffset ?? startOffset - 10;
  const completedOffset = opts.completedOffset ?? (status === "Selesai" ? dueOffset - (taskCounter % 4) : undefined);
  return {
    id: `task-${taskCounter}`,
    title,
    description: opts.description || `Penerangan: ${title}. Perincian keperluan, skop dan keputusan yang dijangka untuk tugasan ini.`,
    assigneeId,
    category,
    priority,
    status,
    progress: opts.progress ?? (status === "Selesai" ? 100 : status === "Menunggu Semakan" ? 95 : status === "Dalam Proses" ? 50 : status === "Disekat" ? 30 : status === "Dibatalkan" ? 0 : 0),
    complexity,
    estimatedHours: opts.estimatedHours ?? complexity * 6 + (taskCounter % 5),
    startOffset,
    dueOffset,
    completedOffset,
    reworkCount: opts.reworkCount ?? 0,
    links: opts.links || [],
  };
}

const TASKS: TaskSeed[] = [
  // Aisyah - Excellent overall, high workload (Latihan)
  t("u-aish", "Menyediakan modul latihan 'Kepimpinan Berkesan'", { category: "Latihan", priority: "Tinggi", status: "Selesai", complexity: 3, estimatedHours: 24, startOffset: 85, dueOffset: 70, completedOffset: 68, reworkCount: 0 }),
  t("u-aish", "Menyelaras logistik program 2 hari di Shah Alam", { category: "Latihan", priority: "Segera", status: "Selesai", complexity: 2, estimatedHours: 18, startOffset: 75, dueOffset: 62, completedOffset: 61, reworkCount: 0 }),
  t("u-aish", "Menyediakan laporan maklum balas peserta kursus", { category: "Latihan", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 8, startOffset: 60, dueOffset: 50, completedOffset: 49, reworkCount: 0 }),
  t("u-aish", "Kemas kini kurikulum kursus Komunikasi Efektif", { category: "Latihan", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 16, startOffset: 50, dueOffset: 35, completedOffset: 34, reworkCount: 0 }),
  t("u-aish", "Facilitate sesi latihan khidmat pelanggan", { category: "Latihan", priority: "Tinggi", status: "Dalam Proses", progress: 60, complexity: 2, estimatedHours: 12, startOffset: 14, dueOffset: -2 }),
  t("u-aish", "Sediakan bahan latihan 'Pengurusan Masa'", { category: "Latihan", priority: "Tinggi", status: "Dalam Proses", progress: 40, complexity: 3, estimatedHours: 20, startOffset: 7, dueOffset: 6 }),
  t("u-aish", "Logistik program korporat di Putrajaya", { category: "Latihan", priority: "Segera", status: "Dalam Proses", progress: 75, complexity: 2, estimatedHours: 14, startOffset: 5, dueOffset: 1 }),
  t("u-aish", "Reka modul 'Kreativiti & Inovasi'", { category: "Latihan", priority: "Sederhana", status: "Menunggu Semakan", progress: 95, complexity: 3, estimatedHours: 22, startOffset: 21, dueOffset: 3, completedOffset: 1 }),
  t("u-aish", "Penilaian pra & pasca latihan", { category: "Latihan", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 6, startOffset: 40, dueOffset: 28, completedOffset: 27, reworkCount: 0 }),
  t("u-aish", "Mesyuarat penambahbaikan modul dengan GM", { category: "Latihan", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 3, startOffset: 30, dueOffset: 25, completedOffset: 25, reworkCount: 0 }),
  t("u-aish", "Sokongan teknikal sesi webinar latihan", { category: "Latihan", priority: "Rendah", status: "Dalam Proses", progress: 20, complexity: 1, estimatedHours: 5, startOffset: 3, dueOffset: 10 }),

  // Hafiz - High quality but often slightly late (Perundingan)
  t("u-hafiz", "Menghantar cadangan perundingan kepada klien korporat", { category: "Perundingan", priority: "Tinggi", status: "Selesai", complexity: 3, estimatedHours: 28, startOffset: 88, dueOffset: 72, completedOffset: 75, reworkCount: 0 }),
  t("u-hafiz", "Analisis keperluan latihan klien GLC", { category: "Perundingan", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 16, startOffset: 70, dueOffset: 55, completedOffset: 58, reworkCount: 0 }),
  t("u-hafiz", "Sesi diagnosis organisasi klien A", { category: "Perundingan", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 12, startOffset: 55, dueOffset: 42, completedOffset: 45, reworkCount: 0 }),
  t("u-hafiz", "Laporan penilaian keberkesanan program", { category: "Perundingan", priority: "Sederhana", status: "Selesai", complexity: 2, estimatedHours: 14, startOffset: 48, dueOffset: 33, completedOffset: 36, reworkCount: 0 }),
  t("u-hafiz", "Cadangan program coaching eksekutif", { category: "Perundingan", priority: "Tinggi", status: "Selesai", complexity: 3, estimatedHours: 20, startOffset: 38, dueOffset: 22, completedOffset: 26, reworkCount: 0 }),
  t("u-hafiz", "Sediakan kontrak perundingan klien B", { category: "Perundingan", priority: "Segera", status: "Dalam Proses", progress: 55, complexity: 2, estimatedHours: 10, startOffset: 9, dueOffset: -3 }),
  t("u-hafiz", "Sesi mentoring pasukan klien", { category: "Perundingan", priority: "Sederhana", status: "Dalam Proses", progress: 35, complexity: 1, estimatedHours: 8, startOffset: 6, dueOffset: 4 }),
  t("u-hafiz", "Kajian benchmarking industri latihan", { category: "Perundingan", priority: "Rendah", status: "Menunggu Semakan", progress: 90, complexity: 2, estimatedHours: 18, startOffset: 20, dueOffset: 2, completedOffset: 3 }),
  t("u-hafiz", "Pembentangan cadangan kepada lembaga", { category: "Perundingan", priority: "Tinggi", status: "Dalam Proses", progress: 65, complexity: 3, estimatedHours: 15, startOffset: 8, dueOffset: 2 }),
  t("u-hafiz", "Follow-up proposal klien C", { category: "Perundingan", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 4, startOffset: 28, dueOffset: 18, completedOffset: 20, reworkCount: 0 }),

  // Nurul - Many initiatives, good comms (Pemasaran)
  t("u-nurul", "Menguruskan kempen media sosial bulan ini", { category: "Pemasaran", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 16, startOffset: 60, dueOffset: 30, completedOffset: 29, reworkCount: 0 }),
  t("u-nurul", "Sediakan kandungan kalendar bulanan", { category: "Pemasaran", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 8, startOffset: 50, dueOffset: 35, completedOffset: 34, reworkCount: 0 }),
  t("u-nurul", "Reka brosur program latihan Q4", { category: "Pemasaran", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 12, startOffset: 40, dueOffset: 25, completedOffset: 24, reworkCount: 0 }),
  t("u-nurul", "Kempen iklan LinkedIn program eksekutif", { category: "Pemasaran", priority: "Tinggi", status: "Dalam Proses", progress: 70, complexity: 2, estimatedHours: 14, startOffset: 10, dueOffset: 2 }),
  t("u-nurul", "Analitik laman web & laporan bulanan", { category: "Pemasaran", priority: "Sederhana", status: "Menunggu Semakan", progress: 92, complexity: 1, estimatedHours: 6, startOffset: 14, dueOffset: 1, completedOffset: 0 }),
  t("u-nurul", "Penulihan artikel blog 'Trend Pembelajaran 2026'", { category: "Pemasaran", priority: "Rendah", status: "Dalam Proses", progress: 45, complexity: 1, estimatedHours: 5, startOffset: 5, dueOffset: 7 }),
  t("u-nurul", "Sesi fotografi program latihan", { category: "Pemasaran", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 4, startOffset: 22, dueOffset: 12, completedOffset: 11, reworkCount: 0 }),
  t("u-nurul", "Kempen e-mel kepada pangkalan klien", { category: "Pemasaran", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 10, startOffset: 18, dueOffset: 8, completedOffset: 7, reworkCount: 1 }),
  t("u-nurul", "Kerjasama influencer industri HR", { category: "Pemasaran", priority: "Rendah", status: "Dalam Proses", progress: 30, complexity: 1, estimatedHours: 6, startOffset: 4, dueOffset: 9 }),
  t("u-nurul", "Pengoptimuman SEO laman web", { category: "Pemasaran", priority: "Sederhana", status: "Selesai", complexity: 2, estimatedHours: 12, startOffset: 35, dueOffset: 20, completedOffset: 19, reworkCount: 0 }),

  // Faizal - Very high quality, rare updates (Pereka Modul)
  t("u-faizal", "Mereka bentuk modul latihan baharu 'Design Thinking'", { category: "Latihan", priority: "Tinggi", status: "Selesai", complexity: 3, estimatedHours: 30, startOffset: 80, dueOffset: 50, completedOffset: 49, reworkCount: 0 }),
  t("u-faizal", "Ilustrasi visual untuk modul kepimpinan", { category: "Latihan", priority: "Sederhana", status: "Selesai", complexity: 2, estimatedHours: 14, startOffset: 55, dueOffset: 38, completedOffset: 37, reworkCount: 0 }),
  t("u-faizal", "Reka bentuk infografik proses kerja", { category: "Pemasaran", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 8, startOffset: 30, dueOffset: 18, completedOffset: 17, reworkCount: 0 }),
  t("u-faizal", "Pembangunan template slaid korporat", { category: "Latihan", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 16, startOffset: 42, dueOffset: 28, completedOffset: 27, reworkCount: 0 }),
  t("u-faizal", "Reka workbook peserta kursus", { category: "Latihan", priority: "Tinggi", status: "Dalam Proses", progress: 50, complexity: 3, estimatedHours: 22, startOffset: 12, dueOffset: 4 }),
  t("u-faizal", "Pengindeksan aset visual syarikat", { category: "Pentadbiran", priority: "Rendah", status: "Dalam Proses", progress: 25, complexity: 1, estimatedHours: 6, startOffset: 8, dueOffset: 12 }),
  t("u-faizal", "Reka sijil penyertaan program", { category: "Pentadbiran", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 3, startOffset: 25, dueOffset: 15, completedOffset: 14, reworkCount: 0 }),
  t("u-faizal", "Visualisasi data untuk laporan tahunan", { category: "Lain", priority: "Sederhana", status: "Menunggu Semakan", progress: 88, complexity: 2, estimatedHours: 10, startOffset: 16, dueOffset: 1, completedOffset: 0 }),
  t("u-faizal", "Modul gamifikasi pembelajaran", { category: "Latihan", priority: "Tinggi", status: "Dalam Proses", progress: 35, complexity: 3, estimatedHours: 26, startOffset: 9, dueOffset: 5 }),
  t("u-faizal", "Reka banner promosi program akhir tahun", { category: "Pemasaran", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 4, startOffset: 20, dueOffset: 10, completedOffset: 9, reworkCount: 0 }),

  // Zulaikha - Consistent, on time, low workload (Pentadbiran & Kewangan)
  t("u-zulaikha", "Menguruskan invois & rekonsiliasi bulanan", { category: "Kewangan", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 12, startOffset: 50, dueOffset: 35, completedOffset: 34, reworkCount: 0 }),
  t("u-zulaikha", "Mengemas kini pangkalan data klien", { category: "Pentadbiran", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 8, startOffset: 45, dueOffset: 30, completedOffset: 29, reworkCount: 0 }),
  t("u-zulaikha", "Penyataakaun bulanan September", { category: "Kewangan", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 10, startOffset: 40, dueOffset: 28, completedOffset: 27, reworkCount: 0 }),
  t("u-zulaikha", "Tuntutan bayaran pengajar luar", { category: "Kewangan", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 4, startOffset: 22, dueOffset: 12, completedOffset: 11, reworkCount: 0 }),
  t("u-zulaikha", "Sedia minit mesyuarat pengurusan", { category: "Pentadbiran", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 3, startOffset: 18, dueOffset: 10, completedOffset: 10, reworkCount: 0 }),
  t("u-zulaikha", "Rekod inventori peralatan latihan", { category: "Pentadbiran", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 5, startOffset: 15, dueOffset: 8, completedOffset: 7, reworkCount: 0 }),
  t("u-zulaikha", "Kemaskini daftar kehadiran staf", { category: "Pentadbiran", priority: "Sederhana", status: "Dalam Proses", progress: 60, complexity: 1, estimatedHours: 4, startOffset: 6, dueOffset: 3 }),
  t("u-zulaikha", "Bayaran cukai SST bulanan", { category: "Kewangan", priority: "Tinggi", status: "Selesai", complexity: 1, estimatedHours: 6, startOffset: 12, dueOffset: 5, completedOffset: 4, reworkCount: 0 }),
  t("u-zulaikha", "Sediakan laporan kewangan Q3", { category: "Kewangan", priority: "Tinggi", status: "Menunggu Semakan", progress: 95, complexity: 3, estimatedHours: 18, startOffset: 14, dueOffset: 2, completedOffset: 1 }),
  t("u-zulaikha", "Tempahan ruang latihan luar", { category: "Pentadbiran", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 2, startOffset: 10, dueOffset: 6, completedOffset: 6, reworkCount: 0 }),

  // Wei Ming - Medium perf, some overdue & blockers (Penyelaras Klien)
  t("u-weiming", "Mengurus pendaftaran peserta program korporat", { category: "Pentadbiran", priority: "Tinggi", status: "Selesai", complexity: 1, estimatedHours: 8, startOffset: 40, dueOffset: 28, completedOffset: 30, reworkCount: 1 }),
  t("u-weiming", "Koordinasi jadual pengajar luar", { category: "Latihan", priority: "Sederhana", status: "Selesai", complexity: 1, estimatedHours: 6, startOffset: 35, dueOffset: 22, completedOffset: 24, reworkCount: 0 }),
  t("u-weiming", "Maklum balas & aduan klien - penyelesaian", { category: "Perundingan", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 10, startOffset: 28, dueOffset: 15, completedOffset: 18, reworkCount: 0 }),
  t("u-weiming", "Sokongan logistik program luar kampus", { category: "Latihan", priority: "Tinggi", status: "Dalam Proses", progress: 45, complexity: 2, estimatedHours: 12, startOffset: 11, dueOffset: -1 }),
  t("u-weiming", "Susunan kontrak pengajar luar", { category: "Pentadbiran", priority: "Sederhana", status: "Disekat", progress: 30, complexity: 1, estimatedHours: 5, startOffset: 8, dueOffset: 3 }),
  t("u-weiming", "Kemas kini portal pendaftaran peserta", { category: "Pentadbiran", priority: "Sederhana", status: "Dalam Proses", progress: 50, complexity: 2, estimatedHours: 10, startOffset: 7, dueOffset: 1 }),
  t("u-weiming", "Laporan kepuasan peserta Q3", { category: "Latihan", priority: "Sederhana", status: "Dalam Proses", progress: 20, complexity: 1, estimatedHours: 6, startOffset: 5, dueOffset: 4 }),
  t("u-weiming", "Pengurusan VIP untuk acara korporat", { category: "Pentadbiran", priority: "Tinggi", status: "Selesai", complexity: 2, estimatedHours: 9, startOffset: 20, dueOffset: 10, completedOffset: 12, reworkCount: 0 }),
  t("u-weiming", "Pemulihan data peserta lama", { category: "Pentadbiran", priority: "Rendah", status: "Dibatalkan", progress: 0, complexity: 1, estimatedHours: 4, startOffset: 16, dueOffset: 9 }),
  t("u-weiming", "Penyelarasan jadual program bulan hadapan", { category: "Latihan", priority: "Tinggi", status: "Menunggu Semakan", progress: 90, complexity: 2, estimatedHours: 8, startOffset: 9, dueOffset: 0, completedOffset: -1 }),
];

// Add a few more personal tasks
TASKS.push(
  t("u-aish", "Mesyuarat mingguan pasukan Latihan", { category: "Latihan", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 2, startOffset: 7, dueOffset: 7, completedOffset: 7, reworkCount: 0 }),
  t("u-nurul", "Mesyuarat mingguan pasukan Pemasaran", { category: "Pemasaran", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 2, startOffset: 7, dueOffset: 7, completedOffset: 7, reworkCount: 0 }),
  t("u-weiming", "Mesyuarat mingguan pasukan Klien", { category: "Pentadbiran", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 2, startOffset: 7, dueOffset: 7, completedOffset: 7, reworkCount: 0 }),
  t("u-zulaikha", "Mesyuarat mingguan pasukan Kewangan", { category: "Kewangan", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 2, startOffset: 7, dueOffset: 7, completedOffset: 7, reworkCount: 0 }),
  t("u-hafiz", "Mesyuarat mingguan pasukan Perundingan", { category: "Perundingan", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 2, startOffset: 7, dueOffset: 7, completedOffset: 7, reworkCount: 0 }),
  t("u-faizal", "Mesyuarat mingguan pasukan Reka Bentuk", { category: "Latihan", priority: "Rendah", status: "Selesai", complexity: 1, estimatedHours: 2, startOffset: 7, dueOffset: 7, completedOffset: 7, reworkCount: 0 }),
);

// ============================================================
// QUALITY REVIEWS (for completed tasks)
// ============================================================
const REVIEW_PROFILES: Record<string, (idx: number) => { a: number; c: number; p: number; s: number }> = {
  "u-aish": (i) => ({ a: 5, c: 5, p: 4 + (i % 2), s: 5 }),
  "u-hafiz": (i) => ({ a: 5, c: 4, p: 5, s: 4 + (i % 2) }),
  "u-nurul": (i) => ({ a: 4 + (i % 2), c: 4, p: 4, s: 4 }),
  "u-faizal": (i) => ({ a: 5, c: 5, p: 5, s: 4 + (i % 2) }),
  "u-zulaikha": (i) => ({ a: 4 + (i % 2), c: 4, p: 4, s: 4 }),
  "u-weiming": (i) => ({ a: 3 + (i % 2), c: 3, p: 3 + (i % 2), s: 3 }),
};
const REVIEW_COMMENTS = [
  "Hasil kerja kemas dan profesional. Terima kasih.",
  "Penyampaian baik, sedikit penambahbaikan pada perincian.",
  "Memenuhi spesifikasi. Teruskan usaha yang baik.",
  "Kualiti boleh dipertingkatkan pada bahagian penyampaian.",
  "Sangat cemerlang, melebihi jangkaan.",
  "Perlu perhatian pada ketepatan maklumat.",
];

// ============================================================
// INITIATIVES
// ============================================================
const INITIATIVES = [
  // Aisyah
  { userId: "u-aish", title: "Automasi pendaftaran peserta melalui borang dalam talian", problem: "Pendaftaran manual mengambil masa dan terdedah kepada ralat.", action: "Membangunkan borang Google + auto-import ke pangkalan data.", outcome: "Menjimatkan 5 jam seminggu & mengurangkan ralat 90%.", impactLevel: "Besar", status: "Disahkan", submittedOffset: 45 },
  { userId: "u-aish", title: "Templat modul latihan serba guna", problem: "Setiap modul dibina dari kosong.", action: "Mencipta templat boleh guna semula.", outcome: "Mempercepat penyediaan modul 40%.", impactLevel: "Sederhana", status: "Disahkan", submittedOffset: 30 },
  { userId: "u-aish", title: "Penambahbaikan aliran maklum balas peserta", problem: "Maklum balas lambat diproses.", action: "Mewujudkan dashboard maklum balas langsung.", outcome: "Tindak balas dalam 24 jam.", impactLevel: "Kecil", status: "Dihantar", submittedOffset: 8 },
  // Hafiz
  { userId: "u-hafiz", title: "Cadangan model penilaian ROI latihan", problem: "Klien mahu lihat pulangan pelaburan latihan.", action: "Menyediakan rangka kerja pengukuran ROI 4 tahap.", outcome: "Diterima pakai oleh 2 klien korporat.", impactLevel: "Besar", status: "Disahkan", submittedOffset: 50 },
  { userId: "u-hafiz", title: "Penambahbaikan templat cadangan perundingan", problem: "Cadangan mengambil masa lama.", action: "Membina bank kandungan modular.", outcome: "Mengurangkan masa 50%.", impactLevel: "Sederhana", status: "Disahkan", submittedOffset: 25 },
  // Nurul - many initiatives
  { userId: "u-nurul", title: "Siri kandungan video pendidikan LinkedIn", problem: "Penglibatan media sosial rendah.", action: "Menghasilkan 8 video pendek bulanan.", outcome: "Penglibatan meningkat 120%.", impactLevel: "Besar", status: "Disahkan", submittedOffset: 40 },
  { userId: "u-nurul", title: "Kerjasama rakan strategik HR", problem: "Capaian pasaran terhad.", action: "Menjalin kerjasama dengan 3 firma HR.", outcome: "12 bakal klien baharu.", impactLevel: "Besar", status: "Disahkan", submittedOffset: 22 },
  { userId: "u-nurul", title: "Optimumkan laman web untuk mobile", problem: "Kadar lantunan tinggi pada mobile.", action: "Menaiktaraf reka bentuk responsif.", outcome: "Kadar lantunan turun 35%.", impactLevel: "Sederhana", status: "Disahkan", submittedOffset: 15 },
  { userId: "u-nurul", title: "Newsletter bulanan pasukan", problem: "Komunikasi dalaman bertaburan.", action: "Memulakan newsletter setiap awal bulan.", outcome: "Pasukan lebih maklum & selaras.", impactLevel: "Kecil", status: "Disahkan", submittedOffset: 10 },
  { userId: "u-nurul", title: "Program rujukan klien", problem: "Kos pemerolehan klien tinggi.", action: "Mereka insentif rujukan.", outcome: "Draf dihantar untuk kelulusan.", impactLevel: "Sederhana", status: "Dihantar", submittedOffset: 5 },
  // Faizal
  { userId: "u-faizal", title: "Sistem reka bentuk visual syarikat", problem: "Aset visual tidak konsisten.", action: "Membina panduan reka bentuk & library.", outcome: "Konsistensi visual meningkat ketara.", impactLevel: "Besar", status: "Disahkan", submittedOffset: 35 },
  { userId: "u-faizal", title: "Templat infografik standard", problem: "Infografik dibina dari kosong.", action: "Mencipta 12 templat.", outcome: "Menjimatkan 6 jam setiap projek.", impactLevel: "Sederhana", status: "Disahkan", submittedOffset: 18 },
  { userId: "u-faizal", title: "Animasi pendek untuk modul", problem: "Modul kurang menarik visual.", action: "Mengintegrasikan animasi ringan.", outcome: "Kepuasan peserta naik 8%.", impactLevel: "Kecil", status: "Dihantar", submittedOffset: 6 },
  // Zulaikha
  { userId: "u-zulaikha", title: "Automasi penjanaan invois berulang", problem: "Invois bulanan dibuat manual.", action: "Menyediakan template auto-jana.", outcome: "Menjimatkan 4 jam sebulan.", impactLevel: "Sederhana", status: "Disahkan", submittedOffset: 28 },
  { userId: "u-zulaikha", title: "Digitisasi rekod inventori", problem: "Inventori dikira secara manual.", action: "Membina spreadsheet berstruktur + kod QR.", outcome: "Pengiraan 5x lebih cepat.", impactLevel: "Kecil", status: "Disahkan", submittedOffset: 12 },
  // Wei Ming
  { userId: "u-weiming", title: "Portal maklumat peserta berpusat", problem: "Maklumat peserta tersebar.", action: "Mencadangkan portal berpusat.", outcome: "Cadangan dalam semakan.", impactLevel: "Sederhana", status: "Dihantar", submittedOffset: 9 },
  { userId: "u-weiming", title: "Penambahbaikan templat e-mel klien", problem: "E-mel tidak konsisten.", action: "Menyediakan 5 templat standard.", outcome: "Draf disemak.", impactLevel: "Kecil", status: "Ditolak", submittedOffset: 16 },
];
const INITIATIVE_POINTS: Record<string, number> = { Kecil: 5, Sederhana: 10, Besar: 20 };

// ============================================================
// ACCOUNTABILITY RATINGS (last 2 months)
// ============================================================
const ACCOUNTABILITY: Record<string, [number, number]> = {
  "u-aish": [5, 5],
  "u-hafiz": [4, 4],
  "u-nurul": [5, 5],
  "u-faizal": [4, 4],
  "u-zulaikha": [5, 4],
  "u-weiming": [3, 3],
};

// ============================================================
// COMMENTS & BLOCKERS
// ============================================================
const COMMENTS_SEED = [
  { taskId: "task-5", authorId: GM_ID, body: "Bagaimana kemajuan modul ini? Sila kemas kini.", offset: 5, isFromGM: true },
  { taskId: "task-5", authorId: "u-aish", body: "Sudah 60% selesai, akan siap sebelum tarikh akhir.", offset: 4, isFromGM: false },
  { taskId: "task-9", authorId: GM_ID, body: "Mohon hantar untuk semakan secepatnya.", offset: 2, isFromGM: true },
  { taskId: "task-9", authorId: "u-aish", body: "Hampir siap, tinggal format akhir sahaja.", offset: 1, isFromGM: false },
  { taskId: "task-19", authorId: GM_ID, body: "Tarikh akhir dah dekat. Adakah boleh siap?", offset: 3, isFromGM: true },
  { taskId: "task-19", authorId: "u-hafiz", body: "Sedang usahakan, mungkin perlu lanjutan sedikit.", offset: 2, isFromGM: false },
  { taskId: "task-32", authorId: GM_ID, body: "Pastikan analitik menyeluruh.", offset: 4, isFromGM: true },
  { taskId: "task-32", authorId: "u-nurul", body: "Noted, sedang menyusun laporan penuh.", offset: 3, isFromGM: false },
  { taskId: "task-44", authorId: GM_ID, body: "Reka bentuk perlu lebih konsisten dengan brand.", offset: 5, isFromGM: true },
  { taskId: "task-44", authorId: "u-faizal", body: "Sudah kemas kini mengikut panduan brand.", offset: 3, isFromGM: false },
  { taskId: "task-57", authorId: GM_ID, body: "Berapa lama lagi untuk siap?", offset: 2, isFromGM: true },
  { taskId: "task-57", authorId: "u-weiming", body: "Ada halangan teknikal, sedang selesaikan.", offset: 1, isFromGM: false },
];

const BLOCKERS_SEED = [
  { taskId: "task-57", reportedById: "u-weiming", type: "Teknikal", description: "Portal pendaftaran rosak, peserta tidak boleh mendaftar.", helpNeeded: "Sokongan IT untuk baiki portal.", status: "Terbuka", offset: 3 },
  { taskId: "task-55", reportedById: "u-weiming", type: "Sumber", description: "Maklumat kontrak pengajar luar tidak lengkap.", helpNeeded: "Pihak kewangan perlu sahkan terma.", status: "Terbuka", offset: 4 },
  { taskId: "task-19", reportedById: "u-hafiz", type: "Klien", description: "Klien lambat beri maklum balas cadangan.", helpNeeded: "Follow-up oleh GM.", status: "Selesai", offset: 6 },
  { taskId: "task-32", reportedById: "u-nurul", type: "Maklumat", description: "Akses data analitik laman web terhad.", helpNeeded: "Kebenaran akses platform.", status: "Selesai", offset: 5 },
  { taskId: "task-44", reportedById: "u-faizal", type: "Sumber", description: "Aset visual lama tidak boleh diakses.", helpNeeded: "Pemulihan fail dari backup.", status: "Terbuka", offset: 2 },
];

// ============================================================
// EXTENSION REQUESTS
// ============================================================
const EXTENSIONS_SEED = [
  { taskId: "task-19", requestedOffset: 3, reason: "Memerlukan masa tambahan untuk semakan klien.", status: "Diluluskan" },
  { taskId: "task-28", requestedOffset: 2, reason: "Tunggu maklum balas pengajar luar.", status: "Menunggu" },
  { taskId: "task-57", requestedOffset: 1, reason: "Halangan teknikal portal pendaftaran.", status: "Menunggu" },
];

// ============================================================
// NOTIFICATIONS
// ============================================================
function buildNotifications() {
  const notifs: any[] = [];
  let nId = 1;
  // Recent task assignments
  for (const task of TASKS.filter(t => t.status === "Dalam Proses" || t.status === "Menunggu Semakan").slice(0, 8)) {
    notifs.push({
      id: `n-${nId++}`,
      userId: task.assigneeId,
      type: "task_assigned",
      title: "Tugasan Baharu",
      message: `Anda ditugaskan: ${task.title}`,
      link: `/tasks?id=${task.id}`,
      read: false,
      createdAt: daysAgo(task.startOffset),
    });
  }
  // Deadline soon for upcoming tasks
  for (const task of TASKS.filter(t => t.dueOffset <= 3 && t.dueOffset >= -1 && t.status !== "Selesai" && t.status !== "Dibatalkan")) {
    notifs.push({
      id: `n-${nId++}`,
      userId: task.assigneeId,
      type: "deadline_soon",
      title: "Tarikh Akhir Hampir",
      message: `"${task.title}" akan tamat ${task.dueOffset <= 0 ? "hari ini" : `dalam ${task.dueOffset} hari`}.`,
      link: `/tasks?id=${task.id}`,
      read: false,
      createdAt: daysAgo(Math.max(0, task.dueOffset - 1)),
    });
  }
  // GM notifications for blockers
  for (const b of BLOCKERS_SEED.filter(b => b.status === "Terbuka")) {
    notifs.push({
      id: `n-${nId++}`,
      userId: GM_ID,
      type: "blocker_reported",
      title: "Halangan Dilaporkan",
      message: `${b.description}`,
      link: `/tasks`,
      read: false,
      createdAt: daysAgo(b.offset),
    });
  }
  // Initiative submitted notifications to GM
  for (const init of INITIATIVES.filter(i => i.status === "Dihantar")) {
    notifs.push({
      id: `n-${nId++}`,
      userId: GM_ID,
      type: "initiative_submitted",
      title: "Inisiatif Baru Diserahkan",
      message: `Inisiatif: ${init.title}`,
      link: `/initiatives`,
      read: false,
      createdAt: daysAgo(init.submittedOffset),
    });
  }
  // Extension request to GM
  for (const ext of EXTENSIONS_SEED.filter(e => e.status === "Menunggu")) {
    notifs.push({
      id: `n-${nId++}`,
      userId: GM_ID,
      type: "extension_request",
      title: "Permintaan Lanjutan Tarikh",
      message: `Permintaan lanjutan untuk tugasan.`,
      link: `/tasks`,
      read: false,
      createdAt: daysAgo(ext.requestedOffset),
    });
  }
  // Extension approved to staff
  for (const ext of EXTENSIONS_SEED.filter(e => e.status === "Diluluskan")) {
    const task = TASKS.find(t => t.id === ext.taskId);
    notifs.push({
      id: `n-${nId++}`,
      userId: task?.assigneeId || GM_ID,
      type: "extension_request",
      title: "Lanjutan Tarikh Diluluskan",
      message: `Tarikh akhir "${task?.title}" telah dilanjutkan.`,
      link: `/tasks?id=${ext.taskId}`,
      read: true,
      createdAt: daysAgo(ext.requestedOffset),
    });
  }
  // Initiative verified to staff
  for (const init of INITIATIVES.filter(i => i.status === "Disahkan")) {
    notifs.push({
      id: `n-${nId++}`,
      userId: init.userId,
      type: "initiative_verified",
      title: "Inisiatif Disahkan",
      message: `Inisiatif anda "${init.title}" disahkan (${INITIATIVE_POINTS[init.impactLevel]} mata).`,
      link: `/initiatives`,
      read: true,
      createdAt: daysAgo(Math.max(0, init.submittedOffset - 2)),
    });
  }
  return notifs;
}

// ============================================================
// MAIN SEED
// ============================================================
async function main() {
  console.log("Resetting database...");
  // Clean all tables (order matters due to FK)
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.extensionRequest.deleteMany();
  await db.blocker.deleteMany();
  await db.comment.deleteMany();
  await db.initiative.deleteMany();
  await db.accountabilityRating.deleteMany();
  await db.qualityReview.deleteMany();
  await db.timeLog.deleteMany();
  await db.taskHistory.deleteMany();
  await db.task.deleteMany();
  await db.setting.deleteMany();
  await db.user.deleteMany();

  console.log("Seeding users...");
  for (const u of USERS) {
    await db.user.create({ data: { ...u, startDate: u.startDate } });
  }

  console.log("Seeding tasks...");
  let reviewIdx = 0;
  for (const task of TASKS) {
    const startD = daysAgo(task.startOffset);
    const dueD = daysAgo(task.dueOffset);
    const completedD = task.completedOffset !== undefined ? daysAgo(task.completedOffset) : null;
    const createdTask = await db.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        createdById: GM_ID,
        category: task.category,
        priority: task.priority,
        status: task.status,
        progress: task.progress,
        complexity: task.complexity,
        estimatedHours: task.estimatedHours,
        startDate: startD,
        dueDate: dueD,
        completedAt: completedD,
        reworkCount: task.reworkCount,
        linksJson: JSON.stringify(task.links),
        isPersonal: false,
      },
    });

    // Add task history entry
    await db.taskHistory.create({
      data: {
        taskId: createdTask.id,
        actorId: GM_ID,
        field: "created",
        oldValue: "",
        newValue: task.title,
        note: "Tugasan dicipta",
        createdAt: startD,
      },
    });

    // Add quality review for completed tasks
    if (task.status === "Selesai" && completedD) {
      const profile = REVIEW_PROFILES[task.assigneeId](reviewIdx);
      reviewIdx++;
      await db.qualityReview.create({
        data: {
          taskId: createdTask.id,
          reviewerId: GM_ID,
          accuracy: profile.a,
          completeness: profile.c,
          professionalism: profile.p,
          specCompliance: profile.s,
          comment: REVIEW_COMMENTS[reviewIdx % REVIEW_COMMENTS.length],
          createdAt: new Date(completedD.getTime() + 2 * DAY),
        },
      });
    }

    // Add time logs for completed & in-progress tasks
    if (task.status === "Selesai" || task.status === "Dalam Proses" || task.status === "Menunggu Semakan") {
      const hoursLogged = task.status === "Selesai" ? task.estimatedHours : task.estimatedHours * (task.progress / 100);
      const sessions = Math.max(1, Math.ceil(hoursLogged / 4));
      const perSession = hoursLogged / sessions;
      for (let s = 0; s < sessions; s++) {
        await db.timeLog.create({
          data: {
            taskId: createdTask.id,
            userId: task.assigneeId,
            date: daysAgo(task.startOffset - s * 3),
            hours: Math.round(perSession * 10) / 10,
            note: "",
          },
        });
      }
    }
  }

  console.log("Seeding initiatives...");
  for (const init of INITIATIVES) {
    const submitted = daysAgo(init.submittedOffset);
    const verified = init.status === "Disahkan" || init.status === "Ditolak" ? daysAgo(Math.max(0, init.submittedOffset - 2)) : null;
    await db.initiative.create({
      data: {
        userId: init.userId,
        title: init.title,
        problem: init.problem,
        action: init.action,
        outcome: init.outcome,
        evidenceJson: JSON.stringify([]),
        impactLevel: init.impactLevel,
        points: INITIATIVE_POINTS[init.impactLevel],
        status: init.status,
        submittedAt: submitted,
        verifiedAt: verified,
        gmComment: init.status === "Disahkan" ? "Inisiatif yang baik dan memberi impak. Diterima." : init.status === "Ditolak" ? "Cadangan baik tetapi perlu perincian lanjut." : "Menunggu semakan.",
        createdAt: submitted,
      },
    });
  }

  console.log("Seeding accountability ratings...");
  const months = [isoDate(daysAgo(30)).slice(0, 7), isoDate(daysAgo(60)).slice(0, 7)];
  for (const staffId of STAFF_IDS) {
    const ratings = ACCOUNTABILITY[staffId];
    if (ratings) {
      await db.accountabilityRating.create({ data: { userId: staffId, period: months[1], rating: ratings[1], comment: "Penilaian bulanan." } });
      await db.accountabilityRating.create({ data: { userId: staffId, period: months[0], rating: ratings[0], comment: "Penilaian bulanan." } });
    }
  }

  console.log("Seeding comments...");
  for (const c of COMMENTS_SEED) {
    await db.comment.create({
      data: {
        taskId: c.taskId,
        authorId: c.authorId,
        body: c.body,
        isFromGM: c.isFromGM,
        createdAt: daysAgo(c.offset),
      },
    });
  }

  console.log("Seeding blockers...");
  for (const b of BLOCKERS_SEED) {
    const reported = daysAgo(b.offset);
    await db.blocker.create({
      data: {
        taskId: b.taskId,
        reportedById: b.reportedById,
        type: b.type,
        description: b.description,
        helpNeeded: b.helpNeeded,
        status: b.status,
        reportedAt: reported,
        resolvedAt: b.status === "Selesai" ? daysAgo(b.offset - 2) : null,
      },
    });
  }

  console.log("Seeding extension requests...");
  for (const e of EXTENSIONS_SEED) {
    const task = TASKS.find(t => t.id === e.taskId);
    await db.extensionRequest.create({
      data: {
        taskId: e.taskId,
        requestedDate: daysAhead(e.requestedOffset + 5),
        reason: e.reason,
        status: e.status,
        createdAt: daysAgo(e.requestedOffset + 2),
      },
    });
    // If approved, set extendedDueDate on task
    if (e.status === "Diluluskan" && task) {
      await db.task.update({ where: { id: e.taskId }, data: { extendedDueDate: daysAhead(e.requestedOffset + 5) } });
    }
  }

  console.log("Seeding notifications...");
  const notifs = buildNotifications();
  for (const n of notifs) {
    await db.notification.create({ data: n });
  }

  console.log("Seeding settings...");
  await db.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  // Seed audit log
  await db.auditLog.create({
    data: { actorId: GM_ID, action: "SEED", entity: "system", entityId: "init", detail: "Sistem dimulakan dengan data demo." },
  });

  console.log(`Seed complete. Users: ${USERS.length}, Tasks: ${TASKS.length}, Initiatives: ${INITIATIVES.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
