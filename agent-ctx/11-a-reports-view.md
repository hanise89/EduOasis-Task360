# Task 11-a — Reports View

**Agent:** Code (frontend/fullstack)
**Feature:** Laporan Prestasi (Reports view) for EDUOASIS TASK360
**File created:** `src/features/reports/reports-view.tsx`

## What was built

A complete, production-ready client component `export function ReportsView()` for the Reports feature, fully in Bahasa Malaysia, Swiss design (sea blue #1F3A5F + teal #0E7C86 accent, status colors via CSS vars). Includes client-side PDF and CSV export with no extra dependencies.

### Sections

1. **Page header** — `PageHeader` helper with `text-[11px] uppercase tracking-wider` eyebrow, "Laporan Prestasi" title, and subtitle. `PeriodSelector` sits on the right.

2. **View toggle (GM only)** — `Tabs` with two triggers:
   - "Laporan Pasukan" (team report)
   - "Laporan Individu" (individual report)
   
   STAF role skips the tabs entirely and renders the individual report directly for themselves.

3. **"Laporan Pasukan" tab** (`TeamReportSection`, GM-only):
   - 4 KPI tiles: Purata Skor Pasukan (avg overall), Bilangan Staf, Tugasan Siap (sum of completed), Tugasan Tertunggak (sum of overdue — accent turns danger if > 0).
   - Sticky-header table inside `max-h-[560px] overflow-y-auto scroll-slim` with columns: rank badge (medal-colored top 3), avatar + name, position (md+), overall score (color-coded), grade badge, completed/overdue/active counts (responsive hide), trend arrow icon.
   - Export buttons: "Eksport CSV" (team CSV) and "Eksport PDF" (client-side print).

4. **"Laporan Individu" tab** (`IndividualReportSectionForGM` + `IndividualReportSection`):
   - GM: Select dropdown bound to `/api/users` filtered to STAF role. Defaults to first staff member via derived value (no `useEffect`). Passes `key={userId-period}` so local state (drilldown, gmNote) resets on staff/period change.
   - STAF: directly renders own report with same key prop.
   - **Header card**: large ScoreRing (size=140, with grade), grade pill, trend arrow + previous score delta, avatar + name + position, period chips showing counts (tasks, initiatives).
   - **6 dimension mini-cards** (`DimensionCard`): name, weight %, animated score bar, Auto/GM/Dinilai-GM badges, expandable drill-down details (AnimatePresence height transition).
   - **Tasks table**: title, category, status badge, priority badge, due date, rating (star + value), rework count (highlighted if > 0). Scroll-slim inside `max-h-[420px]`.
   - **Inisiatif Disahkan list**: card list with impact badge, points, verified date inside `max-h-80 scroll-slim`.
   - **Rating Akauntabiliti list**: star rating (1-5 with filled/empty stars) + period + comment.
   - **Catatan GM / Pelan Tindakan** textarea: local state only (`gmNote`), not persisted to backend, included in PDF output if filled.
   - Export buttons: "Eksport PDF" (full individual report) and "Eksport CSV Tugasan" (tasks only).

### Export helpers (no extra deps)

- `exportToCSV(filename, rows: string[][])` — builds CSV string with proper quoting (RFC 4180), UTF-8 BOM prefix for Excel compatibility, Blob + `URL.createObjectURL` + anchor click + revoke.
- `exportToPDF(title, htmlContent)` — opens new window, writes full HTML document with inline CSS (sea blue #1F3A5F headers, teal #0E7C86 accents, sticky table styling), brand header with generation timestamp, footer "Sulit — Kegunaan Dalaman". Auto-triggers `window.print()` after 300ms delay.
- `escapeHtml(s)` helper for safe injection into PDF HTML.
- Score/grade/impact color helpers (Tailwind classes for UI, hex/short class names for PDF).

### Data layer

- `useQuery(["reports", "team", period])` → `/api/reports/team?period=`
- `useQuery(["reports", "individual", userId, period])` → `/api/reports/individual?userId=&period=`
- `useQuery(["users"])` → `/api/users` (for GM staff selector dropdown)
- Toast notifications (sonner) on export success and pop-up blocked error.

### UI/UX details

- Fully responsive: KPI grid `grid-cols-2 lg:grid-cols-4`, dimension cards `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, header layout collapses on mobile.
- Loading skeletons (`LoadingCard`, table row skeletons) for all async states.
- `EmptyState` with appropriate icons (Users, ListChecks, Award, Star, AlertTriangle) for empty/error states.
- Custom scrollbars (`scroll-slim`) on all long tables and lists.
- `animate-in-fade` via `PageContainer` wrapper on the root.
- Framer Motion: animated progress bars in dimension cards and KPI values, AnimatePresence for drill-down expand.
- Touch-friendly: minimum touch targets via `size="sm"` buttons.
- Score colors: ≥75 success (green), 60-74 warning (amber), <60 danger (red). Grade badges follow `GRADE_META`. No indigo/blue used.
- ARIA: `aria-expanded` on dimension card toggle buttons, semantic HTML (`main`/`section` via Card structure), icon-only buttons have implicit labels via visible text.

## Quality checks

- `bun run lint`: 0 errors in `reports-view.tsx`. (3 pre-existing errors live in other files: `tasks/[id]/route.ts`, `topbar.tsx`, `performance-view.tsx` — not my responsibility.)
- `bunx tsc --noEmit`: 0 errors in `reports-view.tsx`. (Pre-existing parsing error in `tasks/[id]/route.ts` only.)

## Notes for downstream agents

- This view is already wired into `src/components/layout/app-shell.tsx` (case `"reports"` → `<ReportsView />`).
- The dev server still cannot fully render the app because of OTHER missing files referenced from `app-shell.tsx`: `@/features/notifications/notifications-view`, `@/features/settings/settings-view`, `@/features/settings/profile-view`. These are out of scope for task 11-a. Once those files exist, the Reports view will render at the `/` route under the "Laporan" nav item.
- No other files were created or modified.
- Helper functions `exportToCSV` and `exportToPDF` are file-local; if other views need them later, consider extracting to `@/lib/export.ts`.
