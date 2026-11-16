# Task 10-a — Initiatives View

**Agent:** Code (frontend/fullstack)
**Feature:** Initiatives & Penyelesaian Masalah view for EDUOASIS TASK360
**File created:** `src/features/initiatives/initiatives-view.tsx`

## What was built

A complete, production-ready client component `export function InitiativesView()` for the Initiatives feature, fully in Bahasa Malaysia, Swiss design (sea blue #1F3A5F + teal #0E7C86 accent, status colors via CSS vars).

### Sections
1. **Page header** — title "Inisiatif & Penyelesaian Masalah", subtitle "Sumbangan di luar tugasan rasmi", and a "Hantar Inisiatif" button that opens the create dialog.
2. **Status filter tabs** — Semua | Dihantar | Disahkan | Ditolak (segmented control, drives the main list query).
3. **KPI summary cards (3)** — Jumlah Inisiatif, Mata Disahkan (sum of `points` for Disahkan), Menunggu Pengesahan (count of Dihantar). Computed from a separate `["initiatives","all"]` query so totals remain accurate regardless of filter.
4. **Initiative list** — Card per initiative with avatar+name+position, title, outcome preview, status badge, impact badge with points (only for Disahkan), submitted relative time, evidence link chips (collapsible "Lihat butiran" expand with problem/action/outcome detail rows + GM comment + verified timestamp). Long list scrolls inside `max-h-[640px] overflow-y-auto scroll-slim`. Animated with framer-motion `layout` + AnimatePresence.
5. **Verify form** — Shown inline on each card when `user.role === "GM"` AND status is `Dihantar`. Includes Select for impact level (Kecil/Sederhana/Besar with point preview), comment Input, and Disahkan/Ditolak buttons with loading spinners. Calls `PATCH /api/initiatives/[id]/verify`.
6. **Dinding Inisiatif (Wall)** — Separate query `["initiatives","Disahkan"]`. Celebratory gradient header (teal → sea blue) with Trophy icon. Grid of mini recognition cards: avatar, name, position, title, impact badge, points in large accent type. Staggered framer-motion entrance.
7. **Create Initiative dialog** — Form with title (Input, required), problem (Textarea), action (Textarea), outcome (Textarea), and dynamic evidence links (add/remove multiple URL inputs). Submit button with loading state. Resets on close. Calls `POST /api/initiatives`.

### Data layer
- `useQuery(["initiatives", statusFilter])` → main list (matches required queryKey exactly).
- `useQuery(["initiatives", "all"])` → KPI totals.
- `useQuery(["initiatives", "Disahkan"])` → wall.
- All mutations (`apiPost`, `apiPatch`) invalidate the entire `["initiatives"]` query namespace via `qc.invalidateQueries({ queryKey: ["initiatives"] })`.
- Toast notifications (sonner) on success and error.

### UI/UX
- Fully responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for KPIs and wall.
- Loading skeletons (LoadingCard + pulse divs), EmptyState for empty list/wall.
- Status colors: Dihantar=warning (amber), Disahkan=success (green), Ditolak=danger (red). Impact: Kecil=neutral, Sederhana=warning, Besar=success — no blue/indigo used.
- `animate-in-fade` applied via `PageContainer` wrapper.
- Custom scrollbar (`scroll-slim`) on long lists.
- Avatar uses `user.avatarColor` inline style for brand-tinted fallback.
- Touch-friendly button sizes, semantic HTML, ARIA labels on icon-only buttons.

## API contract used
- `GET /api/initiatives?status=all|Dihantar|Disahkan|Ditolak` → `{ initiatives: InitiativeWithUser[] }`
- `POST /api/initiatives` body `{ title, problem, action, outcome, evidenceLinks }`
- `PATCH /api/initiatives/[id]/verify` body `{ status: "Disahkan"|"Ditolak", impactLevel, gmComment }` — GM only.
- POINTS mapping: Kecil=5, Sederhana=10, Besar=20.

## Quality checks
- `bun run lint`: 0 errors in this file (3 pre-existing errors live in other files: `tasks/[id]/route.ts`, `topbar.tsx`, `performance-view.tsx`).
- `tsc --noEmit`: 0 errors for this file.
- Dev server compiles cleanly (`✓ Compiled`); the app-shell import `@/features/initiatives/initiatives-view` resolves.

## Notes for downstream agents
- This view is already wired into `src/components/layout/app-shell.tsx` (case `"initiatives"` → `<InitiativesView />`).
- No other files were created or modified.
- The `Initiative` type in `@/types` does not include a `user` field; this view defines a local `InitiativeWithUser` extension `{ user?: { id, name, position, avatarColor } }` matching the API response.
