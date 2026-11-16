# Task 5 — GM Dashboard + Staff Dashboard (Swiss Design Refinement)

**Agent:** Code (frontend/fullstack)
**Feature:** Apply Swiss design refinements to the GM Dashboard and Staff Dashboard of EDUOASIS TASK360 (Bahasa Malaysia UI).

## Files edited
1. `src/features/dashboard/gm-dashboard.tsx`
2. `src/features/dashboard/staff-dashboard.tsx`

No other feature files were touched. No new packages installed. All UI text remains in Bahasa Malaysia. All existing data fetching, navigation, drill-downs, and motion animations preserved. `"use client"` directives retained on both files.

## Key changes — GM Dashboard

### Page header
- Replaced the inline `<span className="text-[11px] font-medium uppercase tracking-wider ...">Papan Pemuka GM</span>` with the global `.eyebrow` utility class (10px, 600 weight, 0.08em tracking, muted color) — Swiss micro-label convention.
- Header row now uses `flex items-end` so the PeriodSelector aligns to the baseline of the title block.
- Added `pb-4 border-b border-border` hairline below the header to separate it from the KPI row (Swiss section divider).

### KPI cards
- Passed `index={1..4}` to the four `KpiCard` instances so they render the `01` / `02` / `03` / `04` index numerals (via the new KpiCard `index` prop). No code changes inside the KpiCard component itself — its decorative colored top border was already removed in the refactor and it already uses `.card-flat`.

### Leaderboard card
- Card now uses `card-flat rounded-md` (1px hairline border, no shadow, 4px corner).
- `SectionHeader` receives `index={1}` and `eyebrow="Prestasi Pasukan"`.
- Rank badges changed from `rounded-md` to `rounded-sm` square badges with a `border` hairline. Medal colors (gold/silver/bronze for top 3) preserved but now read as sharper square chips with hairline outlines.
- Grade badge changed from `rounded-md` to `rounded-sm` and now also uses the `GRADE_META[s.grade].border` token for a hairline border.
- Score cell already had `tabular-nums` — preserved.
- Avatar inline `style={{ backgroundColor }}` for brand color (#0E7C86 / #1F3A5F) — preserved.

### Radar chart (TeamRadar) — fixes the audit's label clipping issue
- Container height increased from `h-64` to `h-72` and given `px-2` horizontal padding.
- `RadarChart` now declares `outerRadius="70%"` (was `"75%"`) and adds `margin={{ top: 8, right: 24, bottom: 8, left: 24 }}` to give the perimeter labels (Penyiapan, Ketepatan, Kualiti, Inisiatif, Komunikasi, Produktiviti) more room.
- `PolarAngleAxis` tick font reduced from 10 to 9 (audit requirement).
- `Tooltip` `borderRadius` reduced from 8 to 4 to match the sharper Swiss radius scale.
- Card section labelled `index={2}` + `eyebrow="Profil Pasukan"`.

### Workload heatmap — fixes the audit's triple-encoding issue
- Removed the absolute-positioned `{w.utilisation}%` label inside the bar.
- Moved the percentage as a small `tabular-nums` number (`w-9 text-right`) placed after the bar but before the StatusBadge, so the bar fill + status pill remain and the score ring on the right is preserved.
- Bar fill `rounded` removed (now flat — inside `rounded-sm` container with `overflow-hidden`).
- Legend swatches changed from `rounded` to `rounded-sm`.
- Card labelled `index={3}` + `eyebrow="Beban Kerja"`.

### Attention list (Perlu Perhatian) — sharper left-edge color bar
- Each `AttentionItem` button now has `relative overflow-hidden` and a `absolute left-0 top-0 bottom-0 w-px` 1px-wide full-height color bar in the type's saturated status color (`bg-status-danger` / `bg-status-warning`). Replaces the previous rounded background tile behind the icon.
- Icon container changed from `rounded-md` colored bg tile to a `rounded-sm border border-border` hairline-outlined square container holding the same icon.
- Button left padding bumped to `pl-3` so content doesn't crowd the accent bar.
- `item.utilisation` cell now uses `tabular-nums`.
- Card labelled `index={4}` + `eyebrow="Isu Kritikal"`.

## Key changes — Staff Dashboard

### Page header
- Same Swiss treatment: `.eyebrow` for "Papan Pemuka Staf", `flex items-end`, `pb-4 border-b border-border` hairline separator.

### KPI cards
- `index={1..4}` passed to the four KPI cards (Tugasan Hari Ini, Tertunggak, Dalam Proses, Skor Prestasi).

### Score panel (Skor Prestasi Saya)
- Card gets `card-flat rounded-md`.
- `SectionHeader index={1} eyebrow="Prestasi Saya"`.
- Grade pill changed from `rounded-full` to `rounded-sm` with hairline border using `GRADE_META` tokens.
- Dimension progress track and fill: removed `rounded-full` (now flat bar inside `overflow-hidden` container). Sharper Swiss geometry.
- Dimension weight `%` now also has `tabular-nums`.

### Today tasks & overdue card
- Card gets `card-flat rounded-md`.
- `SectionHeader index={2} eyebrow="Tindakan Segera"`.
- "Lewat N hari" label now uses `tabular-nums`.
- Today-task progress track and fill: removed `rounded-full` (flat bar). Progress `%` label gets `tabular-nums`.

### Initiatives card
- Card gets `card-flat rounded-md`.
- `SectionHeader index={3} eyebrow="Sumbangan Tambahan"`.
- Initiative item border tightened to `border-border` (was `border-border/60`).
- Initiative status pill: `rounded` → `rounded-sm` with hairline `border` using status tokens.
- Points label `+{i.points}p` now uses `tabular-nums`.

### GM feedback card
- Card gets `card-flat rounded-md`.
- `SectionHeader index={4} eyebrow="Maklum Balas"`.
- GM avatar container changed from `rounded-full` to `rounded-sm`.
- Feedback body container changed from `rounded` to `rounded-sm`.
- Item border tightened to `border-border`.

## Density
- KPI grids remain `gap-3 lg:gap-4`; main section grids remain `gap-4 lg:gap-6`; card padding remains `p-4 lg:p-5` (already at the Swiss tightened baseline per task instructions).

## What was NOT touched
- All other feature files (login, tasks, performance, workload, initiatives, reports, notifications, settings, profile).
- No new packages installed.
- All `"use client"` directives preserved.
- All data fetching (`useQuery` / `apiGet`), all `setView` / `setSelectedStaffId` / `setSelectedTaskId` navigation handlers, all framer-motion animations (`motion.div` width animations on bars, `ScoreRing` transition, `PageContainer` `animate-in-fade`) — preserved.

## Lint result

```
$ cd /home/z/my-project && bun run lint 2>&1 | tail -20
$ eslint .
```

No errors, no warnings. Clean lint pass.

## Dev server log
Checked `/home/z/my-project/dev.log` — both dashboard components recompiled successfully (`✓ Compiled in 144ms` / `167ms` / `139ms`) with no React or TypeScript errors.
