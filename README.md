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
- **Database**: Supabase (PostgreSQL 17) via Prisma ORM — connection pooler (Supavisor)
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
- A [Supabase](https://supabase.com) project (free tier works fine)

### Installation

```bash
# 1. Clone and install dependencies
git clone https://github.com/hanise89/EduOasis-Task360.git
cd EduOasis-Task360
bun install

# 2. Create your Supabase project at https://supabase.com
#    - Note your Project URL, Project Ref, and database password
#    - The project region must match the pooler URL region

# 3. Copy the env template and fill in your Supabase credentials
cp .env.example .env
# Edit .env and replace YOUR_PROJECT_REF, YOUR_PASSWORD, YOUR_REGION, etc.
# Example (ap-northeast-2 region):
#   DATABASE_URL="postgresql://postgres.ULOXIK...:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# 4. Push the Prisma schema to Supabase (creates 13 tables) + seed demo data
bun run db:setup
#   — or step by step:
#   bun run db:generate   # generate Prisma Client for PostgreSQL
#   bun run db:push       # create 13 tables in Supabase
#   bun run db:seed       # seed 1 GM + 6 staff + 67 tasks + 17 initiatives (3 months)

# 5. Start the dev server
bun run dev
```

The app runs on `http://localhost:3000`.

### Finding your Supabase connection string

In your Supabase dashboard, go to **Project Settings → Database → Connection string**.

- **Recommended (Session mode pooler, port 5432)** — works for both migrations and runtime:
  ```
  postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-0-{REGION}.pooler.supabase.com:5432/postgres
  ```
  The username must be `postgres.{PROJECT_REF}` (with the project ref appended).

- **Transaction mode pooler (port 6543)** — runtime only, not for Prisma migrations.

- **Direct connection (port 5432 on `db.{REF}.supabase.co`)** — IPv6 only, may be blocked in some networks.

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| GM | `rohana@eduoasis.my` | `demo123` |
| Staf | `aisyah@eduoasis.my` | `demo123` |

Or use the **quick demo login buttons** on the login page ("Sebagai GM" / "Sebagai Staf").

### Reset Demo Data
Use the "Set Semula Data Demo" button in **Tetapan → Log Audit** to restore the original seed data at any time. This runs `prisma/seed.ts` which clears all tables and re-inserts the demo data.

---

## Project Structure

```
prisma/
├── schema.prisma        # 13 entities: User, Task, TaskHistory, TimeLog,
│                        #   QualityReview, Initiative, Comment, Blocker,
│                        #   AccountabilityRating, ExtensionRequest,
│                        #   Notification, AuditLog, Setting
└── seed.ts              # Dummy data: 1 GM + 6 staff + 67 tasks + 17 initiatives (3 months)

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

This is a **prototype with a real database** (Supabase / PostgreSQL via Prisma). It is not production-hardened:

- Passwords are stored as plain text (`demo123`) — **must use hashing (bcrypt/argon2)** in production
- Session uses signed cookies — upgrade to JWT + secure HTTP-only cookies for production
- Database uses the Supabase connection pooler — for high-traffic production, consider read replicas + connection tuning
- No CSRF protection on mutations — add for production
- Demo data reset is destructive — gate behind admin confirmation in production
- Supabase Row-Level Security (RLS) is **not enabled** — the app relies solely on application-layer role checks. Enable RLS policies for defense-in-depth before going to production.

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
