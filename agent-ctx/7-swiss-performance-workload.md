# Task 7 — Performance + Workload Views (Swiss Design Refinements)

**Agent:** Code (frontend/fullstack)
**Files edited:**
- `src/features/performance/performance-view.tsx`
- `src/features/workload/workload-view.tsx`

## Goal

Apply Swiss design refinements to the existing Performance (Prestasi) and Workload (Beban Kerja) views, leveraging the design tokens already established in `globals.css` (`--radius-*`, `--border`, `.card-flat`, `.eyebrow`, `.index-numeral`, `.num-display`, `.tabular-nums`, `.scroll-slim`, status colours) and the refactored common components (`SectionHeader` with `index`/`eyebrow` props, `KpiCard` with `index` prop, `StatusBadge` with sharper hairline border, `ScoreRing` with butt cap).

All UI text remains in Bahasa Malaysia. Data fetching logic (`useQuery`, `apiGet`, `apiPost`), calculations, and number formatting are unchanged.

---

## Performance View (`performance-view.tsx`)

### Page header
- Wrapped both header sections (GM overview + staff detail) with `border-b border-border pb-4` to add a Swiss hairline below.
- Replaced inline `text-[11px] font-medium uppercase tracking-wider text-muted-foreground` spans with `.eyebrow` class.
  - GM overview: eyebrow = `PRESTASI STAF`
  - Staff detail: eyebrow = `PRESTASI INDIVIDU`

### Cards / surfaces
- All `Card` elements received `card-flat rounded-md` (hairline border, no shadow).
- `SectionHeader` invocations now pass `index` (01, 02, …) and `eyebrow` props.
- `EmptyState` already Swiss-styled in `ui.tsx`; left untouched.

### GM ranking list
- Ranking badge: `rounded-md` → `rounded-sm` + `.index-numeral` (zero-padded `01`, `02`, …).
- Staff row border: `rounded-md` → `rounded-sm` + `hover:border-border-strong`.
- Grade chip: `rounded` → `rounded-sm` + explicit `border` via `GRADE_META[s.grade].border`.

### Overall score card
- "Skor Keseluruhan" label uses `.eyebrow`.
- Grade badge: `rounded-full` → `rounded-sm` + hairline `border` from `GRADE_META`.
- Trend text: added `.tabular-nums` for numeric alignment.

### Radar chart (Profil 6 Dimensi)
- `outerRadius="70%"` + `margin={{ top: 8, right: 24, bottom: 8, left: 24 }}` so axis labels are NOT clipped.
- Tick font sizes: PolarAngleAxis 10, PolarRadiusAxis 9.
- Replaced `hsl(var(--border))` → `var(--border)` (since tokens are now oklch).
- Replaced `hsl(var(--muted-foreground))` → `var(--muted-foreground)`.
- Radar stroke/fill: hardcoded `#0E7C86` → `var(--chart-1)` (teal accent).
- Tooltip `borderRadius: 8` → `2` (Swiss sharp) + explicit `border: 1px solid var(--border)`.

### Dimension score-summary cards (6 cards grid)
This is the core Swiss refinement. Each card now shows, in this order:
1. **Index numeral** `01`–`06` (left, `.index-numeral`).
2. **Dimension name** as `.eyebrow` (uppercase, tracked).
3. **Chevron** indicator on right (down when expanded, right when collapsed).
4. **Large score** as `.num-display .tabular-nums .text-3xl` (colour-graded green/amber/red).
5. **`/100`** denominator + small Auto/GM pill (sharp `rounded-sm` with hairline border).
6. **Sharp horizontal bar** — track `h-1 bg-muted rounded-none`, fill `rounded-none`, animated by framer-motion. No more `rounded-full`.
7. **Contribution row** — "Pemberat X%" and "Sumbangan Y%" in `.tabular-nums`, where `Sumbangan = Math.round((score × weight) / 100)`.

### Drill-down section
- Trigger hairline `border-t border-border`.
- Header "DRILL-DOWN SUMBER SKOR" uses `.eyebrow`.
- Each contributing record row uses `border-b border-border/50` (hairline rows, last row `border-b-0`).
- Numeric values use `.tabular-nums .num-display`.

### Trend chart (Trend 6 Bulan Terakhir)
- Grid lines: `stroke="var(--border)"` (very subtle, was `hsl(var(--border))` which broke with oklch tokens).
- Axis ticks: `fill="var(--muted-foreground)"`.
- Tooltip: `borderRadius: 2` + explicit `1px solid var(--border)` border.
- Line colours mapped to design tokens:
  - overall (primary metric): `var(--chart-2)` (navy).
  - taskCompletion: `var(--chart-1)` (teal).
  - workQuality: `var(--chart-3)` (green).
  - timeliness: `var(--chart-4)` (amber).

### Comparison bar chart (GM overview)
- Grid + ticks migrated to `var(--border)` / `var(--muted-foreground)`.
- Tooltip `borderRadius: 2` + hairline border.
- Bar top radius: `[3,3,0,0]` → `[2,2,0,0]` (sharper).
- Palette: hex array → CSS vars (`var(--chart-1)` … `var(--chart-5)` + `var(--status-danger)`).

### Accountability dialog
- Rating buttons: `rounded` → `rounded-sm` + `border` (sharp Swiss pills).
- Month input + textarea: added `rounded-sm`.
- Rating buttons use `.tabular-nums` for number alignment.

### Roundedness audit
- Removed every `rounded-full` (grade badge, status dots, progress bars) → replaced with `rounded-sm` or `rounded-none` as appropriate.
- No `rounded-lg` / `rounded-xl` / `shadow-*` remain in this file.

---

## Workload View (`workload-view.tsx`)

### Page header
- Wrapped with `border-b border-border pb-4`.
- Inline eyebrow span → `.eyebrow` class with text `BEBAN KERJA STAF`.

### KPI cards
- Added `index={1..4}` prop to all four KpiCards (Total Staf, Beban Berlebihan, Beban Tinggi, Seimbang).

### Workload list / staff capacity cards
- Wrapped `Card` content with `card-flat rounded-md`.
- Added `index` prop to `WorkloadRow` and rendered `.index-numeral` `01`–`0N` on the left (hidden on `xs` screens via `hidden sm:inline`).
- Avatar fallback: `rounded-full` → `rounded-sm`.
- **Large utilisation %** rendered as `text-2xl font-semibold tabular-nums num-display` (per spec) — moved out of the bar into its own baseline row.
- Hours summary `{activeTaskHours}h / {availableHoursWeek}h` rendered in `.tabular-nums` on the right of the same baseline row.
- **Sharp horizontal bar**: track `h-1.5 rounded-none bg-muted`, fill `rounded-none`, animated by framer-motion.
- **100% reference line**: changed `bg-border/60` → `bg-border-strong` for sharper Swiss contrast.
- Status badge: unchanged (already Swiss-styled via `StatusBadge`).

### Week segmented control
- Replaced `rounded-md bg-muted/60` outer with `rounded-sm border border-border overflow-hidden bg-card` (sharper container).
- Buttons now use `border-l border-border` dividers between segments (no `gap`).
- Active button: `bg-background text-foreground` (no shadow per Swiss rule).
- Inactive buttons: `text-muted-foreground hover:bg-muted/40`.
- Added `.tabular-nums`.

### Heatmap
- SectionHeader uses `index={2}` + `eyebrow="Peta Haba"`.
- **Hairline grid**: replaced per-cell `border border-transparent` with a parent `bg-border/40` + `space-y-px` / `gap-px` technique. The grandparent's `bg-border/40` shows through every 1px gap to produce clean single-line hairlines between cells — no double borders.
- Staff name column has `bg-card` so the hairline doesn't bleed into it.
- Cells: `rounded` → `rounded-none` (sharp squares per spec).
- Current week cell emphasised with `ring-1 ring-inset ring-accent` (sharper than previous `border-accent/60 ring-1 ring-accent/30`).
- Week labels use `.eyebrow` (was `text-[10px] font-medium leading-tight`).
- **Legend**: swatches changed from `w-3 h-3 rounded` to `w-2.5 h-2.5 rounded-sm border border-border` (sharp squares with hairline borders, per spec). Header text uses `.eyebrow`.

### Alerts list
- Alert container: kept `rounded-md` (per spec — only `rounded-lg`/`rounded-xl` need replacement), added `card-flat`.
- Icon container: `rounded-md` → `rounded-sm` + `border` for sharper Swiss look.
- Added `.tabular-nums` to all numeric spans (utilisation %, hours, task counts).
- SectionHeader uses `index={3}` + `eyebrow="Amaran"`.

### Skeleton states
- Avatar skeleton: `rounded-full` → `rounded-sm`.
- Alert skeleton: added `rounded-md`.

### Roundedness audit
- No `rounded-full` / `rounded-lg` / `rounded-xl` remain in this file.
- No `shadow-*` classes remain (the only `shadow-sm` on the segmented control active button was removed).

---

## Lint result

```
$ eslint .
$ echo $?
0
```

Zero errors, zero warnings. The previous pre-existing lint errors in `performance-view.tsx` (referenced in the Task 10-a record) are now resolved by this refactor — the file passes cleanly.

Dev server log shows `✓ Compiled in 255ms` after the changes; no TypeScript or runtime errors.

---

## Files NOT touched (per task constraints)

- `src/app/globals.css` (already established)
- `src/components/common/ui.tsx`, `kpi-card.tsx`, `score-ring.tsx`, `period-selector.tsx` (already refactored)
- `src/lib/meta.ts` (already Swiss-styled)
- Any API route, prisma schema, or other feature files

## Notes for downstream agents

- The radar chart now uses `outerRadius="70%"` + `margin={{ top: 8, right: 24, bottom: 8, left: 24 }}` — if other views use `RadarChart`, follow the same pattern to avoid clipped axis labels.
- The heatmap `bg-border/40 + gap-px` technique is a clean way to get Swiss hairline grids without double borders; reusable in any future matrix/grid component.
- Recharts strokes/fills should always reference CSS vars (`var(--chart-1)`, `var(--border)`, `var(--muted-foreground)`) — NOT `hsl(var(--…))`, since the design tokens in `globals.css` use `oklch()`.
