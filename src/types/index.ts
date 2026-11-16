// Shared TypeScript types for EDUOASIS TASK360

export type Role = "GM" | "STAF";

export type TaskCategory =
  | "Latihan"
  | "Perundingan"
  | "Pemasaran"
  | "Pentadbiran"
  | "Kewangan"
  | "Sekolah Berlesen"
  | "Lain";

export type Priority = "Rendah" | "Sederhana" | "Tinggi" | "Segera";

export type TaskStatus =
  | "Belum Mula"
  | "Dalam Proses"
  | "Menunggu Semakan"
  | "Selesai"
  | "Disekat"
  | "Dibatalkan";

export type InitiativeImpact = "Kecil" | "Sederhana" | "Besar";
export type InitiativeStatus = "Dihantar" | "Disahkan" | "Ditolak";
export type BlockerType = "Maklumat" | "Sumber" | "Klien" | "Teknikal" | "Lain";
export type BlockerStatus = "Terbuka" | "Selesai";
export type ExtensionStatus = "Menunggu" | "Diluluskan" | "Ditolak";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  position: string;
  weeklyHours: number;
  avatarColor: string;
  startDate: string;
  active: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  createdById: string;
  category: TaskCategory | string;
  priority: Priority | string;
  status: TaskStatus | string;
  progress: number;
  complexity: number;
  estimatedHours: number;
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  extendedDueDate: string | null;
  reworkCount: number;
  links: string[];
  isPersonal: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  createdBy?: User;
  timeLogs?: TimeLog[];
  qualityReviews?: QualityReview[];
  comments?: Comment[];
  blockers?: Blocker[];
  extensionRequests?: ExtensionRequest[];
  history?: TaskHistory[];
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  note: string;
}

export interface QualityReview {
  id: string;
  taskId: string;
  reviewerId: string;
  accuracy: number;
  completeness: number;
  professionalism: number;
  specCompliance: number;
  comment: string;
  createdAt: string;
}

export interface Initiative {
  id: string;
  userId: string;
  title: string;
  problem: string;
  action: string;
  outcome: string;
  evidenceLinks: string[];
  impactLevel: InitiativeImpact | string;
  points: number;
  status: InitiativeStatus | string;
  submittedAt: string;
  verifiedAt: string | null;
  gmComment: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  replyToId: string | null;
  isFromGM: boolean;
  createdAt: string;
  author?: User;
}

export interface Blocker {
  id: string;
  taskId: string;
  reportedById: string;
  type: BlockerType | string;
  description: string;
  helpNeeded: string;
  status: BlockerStatus | string;
  reportedAt: string;
  resolvedAt: string | null;
}

export interface AccountabilityRating {
  id: string;
  userId: string;
  period: string;
  rating: number;
  comment: string;
}

export interface ExtensionRequest {
  id: string;
  taskId: string;
  requestedDate: string;
  reason: string;
  status: ExtensionStatus | string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  timestamp: string;
}

export interface Settings {
  weights: DimensionWeights;
  initiativeTargetMonthly: number;
  initiativeTargetQuarterly: number;
  gradeBands: GradeBands;
  workingDays: number[];
  holidays: string[];
}

export interface DimensionWeights {
  taskCompletion: number;
  timeliness: number;
  workQuality: number;
  initiative: number;
  communication: number;
  productivity: number;
}

export interface GradeBands {
  A: { min: number; max: number };
  B: { min: number; max: number };
  C: { min: number; max: number };
  D: { min: number; max: number };
  E: { min: number; max: number };
}

export interface TaskHistory {
  id: string;
  taskId: string;
  actorId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  note: string;
  createdAt: string;
}

export type PeriodKey = "week" | "month" | "quarter" | "all";

export interface ScorePeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface DimensionScore {
  key: string;
  name: string;
  weight: number;
  score: number;
  isAutomatic: boolean;
  isGmRated: boolean;
  details: ScoreDetail[];
}

export interface ScoreDetail {
  label: string;
  value: string;
  hint?: string;
}

export interface StaffScore {
  userId: string;
  userName: string;
  period: ScorePeriod;
  dimensions: DimensionScore[];
  overall: number;
  grade: string;
  gradeLabel: string;
  trend: "up" | "down" | "flat";
  previousOverall: number | null;
}

export type WorkloadStatus = "Rendah" | "Seimbang" | "Tinggi" | "Beban Berlebihan";

export interface WorkloadInfo {
  userId: string;
  userName: string;
  activeTaskHours: number;
  availableHoursWeek: number;
  utilisation: number;
  status: WorkloadStatus;
  activeTasks: number;
}

export interface Session {
  user: User;
}
