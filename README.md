# EDUOASIS TASK360

**Sistem Pemantauan Prestasi Staf & Tugasan** — Staff Performance & Task Monitoring System

Built for **Al Amin Edu Oasis** (training & consultancy provider). An internal web application that lets the General Manager assign tasks, track work progress, and evaluate the performance of 6 staff members objectively, transparently, and data-driven across six performance dimensions.

---

## Features

### Roles
- **GM (General Manager)** — 1 user: full access to all data, evaluations, reports, and settings
- **Staf (Staff)** — 6 users: view own tasks, log time, submit initiatives, view own performance scores

### Modules (11 screens)
1. **Log Masuk** — Login with quick demo buttons for GM / Staf
2. **Papan Pemuka GM** — KPI cards, staff leaderboard, 6-dimension radar, workload heatmap, attention list
3. **Papan Pemuka Staf** — today's tasks, own score, initiatives, GM feedback
4. **Tugasan (Kanban + Senarai)** — drag-and-drop board + filterable list view
5. **Butiran Tugasan** — info, threaded comments, time logs, history, GM quality review
6. **Prestasi Staf** — 6-dimension scores with drill-down to source records, 6-month trend
7. **Beban Kerja** — staff capacity vs active tasks, utilisation bands, weekly heatmap
8. **Inisiatif** — staff submit, GM verifies with impact level (Kecil/Sederhana/Besar), Dinding Inisiatif
9. **Laporan** — individual & team reports, period filter, PDF/CSV export, GM action-plan notes
10. **Notifikasi** — in-app notification center with read/unread state
11. **Tetapan** — dimension weights, initiative targets, grade bands, working days, holidays, audit log, reset demo data

### Six Performance Dimensions (PRD §6)
| # | Dimension | Weight | Source |
|---|-----------|--------|--------|
| 1 | Task Completion | 20% | Task status (automatic) |
| 2 | Timeliness | 15% | Due date vs completed date (automatic) |
| 3 | Work Quality | 25% | GM rating (1–5) + rework rate (semi-automatic) |
| 4 | Initiative & Problem Solving | 10% | Verified initiatives (semi-automatic) |
| 5 | Communication & Accountability | 15% | Update frequency, SLA response, blocker reporting, GM rating |
| 6 | Productivity & Workload | 15% | Throughput + utilisation (automatic) |

**Overall Score** = Σ (dimension score × weight) → Grade: A (90–100), B (75–89), C (60–74), D (40–59), E (<40)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- **Database**: Prisma ORM + SQLite (real persistent dummy database)
- **State**: Zustand (client) + TanStack Query (server)
- **Charts**: Recharts (radar, line, bar, heatmap)
- **Drag & Drop**: @dnd-kit/core
- **Forms**: React Hook Form + Zod
- **Dates**: date-fns (Malay locale)
- **UI text**: Bahasa Malaysia (default), with Swiss design aesthetic

---

## Getting Started

### Prerequisites
- Node.js 18+ and [Bun](https://bun.sh/) (or npm/pnpm/yarn)

### Installation

```bash
# 1. Install dependencies
bun install

# 2. Set up the database (creates SQLite file + applies schema + seeds demo data)
bun run db:setup
#   — or step by step:
#   bun run db:push      # create schema
#   bun run db:seed      # seed 1 GM + 6 staff + ~70 tasks over 3 months

# 3. Start the dev server
bun run dev
```

The app runs on `http://localhost:3000`.

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| GM | `rohana@eduoasis.my` | `demo123` |
| Staf | `aisyah@eduoasis.my` | `demo123` |

Or use the **quick demo login buttons** on the login page ("Sebagai GM" / "Sebagai Staf").

### Reset Demo Data
Use the "Set Semula Data Demo" button in **Tetapan → Log Audit** to restore the original seed data at any time.

---

## Project Structure

```
prisma/
├── schema.prisma        # All 12 entities: User, Task, TaskHistory, TimeLog,
│                        #   QualityReview, Initiative, Comment, Blocker,
│                        #   AccountabilityRating, ExtensionRequest,
│                        #   Notification, AuditLog, Setting
└── seed.ts              # Dummy data: 1 GM + 6 staff + ~70 tasks (3 months)

src/
├── app/
│   ├── api/             # 25+ REST endpoints (auth, tasks, performance,
│   │                    #   dashboard, workload, initiatives, reports,
│   │                    #   notifications, settings, audit)
│   ├── globals.css      # Swiss design tokens (sharp radii, hairline rules)
│   ├── layout.tsx
│   └── page.tsx         # Root route (login OR app shell based on session)
├── components/
│   ├── common/          # KpiCard, ScoreRing, PeriodSelector, SectionHeader
│   ├── layout/          # Sidebar, Topbar, MobileNav, AppShell
│   └── ui/              # shadcn/ui component set
├── features/
│   ├── login/           # Login screen with quick demo buttons
│   ├── dashboard/       # GM + Staff dashboards
│   ├── tasks/           # Kanban, list, detail, form dialog
│   ├── performance/     # 6-dimension scores with drill-down
│   ├── workload/        # Capacity vs active tasks, heatmap
│   ├── initiatives/     # Submit/verify flow, Dinding Inisiatif
│   ├── reports/         # Individual & team reports, PDF/CSV export
│   ├── notifications/   # Notification center
│   └── settings/        # Settings + Profile
├── lib/
│   ├── scoring.ts       # 6-dimension scoring engine (PRD §6 formulas)
│   ├── workload.ts      # Workload/utilisation calculation
│   ├── db.ts            # Prisma client singleton
│   ├── session.ts       # Cookie-based session
│   ├── api.ts           # Fetch wrapper
│   ├── store.ts         # Zustand store
│   └── meta.ts          # Status/badge/grade metadata
└── types/
    └── index.ts         # TypeScript models
```

---

## Swiss Design Aesthetic

The UI follows International Typographic Style (Swiss design) principles:

- **Sharp geometry** — radius scale 2–8px (no large rounded corners)
- **Hairline borders** — 1px borders replace drop shadows (flat surfaces)
- **Index numerals** — `01`, `02`, `03` prefacing every section
- **Eyebrow micro-labels** — uppercase 10px with 0.08em letter-spacing
- **Tabular numerals** — `font-variant-numeric: tabular-nums` for data alignment
- **Tight type tracking** — headings −0.028em to −0.014em
- **Restrained palette** — navy `#1F3A5F` + teal `#0E7C86` + status colors (green/yellow/red/blue/grey)
- **Dark mode** supported throughout

---

## Production Notes (v1.0 Prototype)

This is a **prototype with a real dummy database** (Prisma + SQLite). It is not production-hardened:

- Passwords are stored as plain text (`demo123`) — **must use hashing (bcrypt/argon2)** in production
- Session uses signed cookies — upgrade to JWT + secure HTTP-only cookies for production
- SQLite is single-file — swap to PostgreSQL/MySQL for concurrent users (just change `provider` in `schema.prisma`)
- No CSRF protection on mutations — add for production
- Demo data reset is destructive — gate behind admin confirmation in production

### Future Phases (per PRD §14)
- Real authentication (NextAuth.js with credentials/OAuth)
- Email/WhatsApp notifications
- 360° peer reviews
- AI-powered performance forecasting
- Mobile native apps

---

## Documentation

See the original PRD (`DOKUMEN KEPERLUAN PRODUK`) for the full requirements specification covering:
- 6-dimension scoring formulas (§6)
- Functional requirements AUTH/DASH/TASK/TIME/QUAL/INIT/COMM/SCORE/RPT/NOTIF/SET (§7)
- Non-functional requirements (§8)
- User flows (§9)
- Screen list & UI guidelines (§10)
- Technical architecture (§11)
- Data model (§12)
- Seed data (§13)

---

## License

Internal use only — **Sulit — Kegunaan Dalaman**. Property of Al Amin Edu Oasis.

v1.0 Prototaip · Built with Next.js 16 + Prisma + Tailwind CSS 4
