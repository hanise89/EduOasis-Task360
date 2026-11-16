# Task 8 — Swiss design refinements on the remaining 5 views

**Agent:** Code (frontend/fullstack)
**Scope:** Initiatives + Reports + Notifications + Settings + Profile views for EDUOASIS TASK360
**Predecessor work:** `/agent-ctx/10-a-initiatives-view.md`, `/agent-ctx/11-a-reports-view.md`, `/agent-ctx/11-b-notifications-view.md`, `/agent-ctx/11-c-settings-profile-view.md`

## Files edited (and only these)

1. `/home/z/my-project/src/features/initiatives/initiatives-view.tsx`
2. `/home/z/my-project/src/features/reports/reports-view.tsx`
3. `/home/z/my-project/src/features/notifications/notifications-view.tsx`
4. `/home/z/my-project/src/features/settings/settings-view.tsx`
5. `/home/z/my-project/src/features/settings/profile-view.tsx`

No new packages installed. No backend or data-fetching logic touched. All `"use client"` directives preserved. All UI text remains in Bahasa Malaysia.

## Design system used (already defined in `src/app/globals.css`)

- `--radius-xs/sm/md/lg/xl` — sharp 2-8px radii
- `--border` (hairline) + `--border-strong`
- `.card-flat` (1px hairline border, no shadow)
- `.card-hairline`, `.hairline-t/-b/-l/-r`
- `.index-numeral` (tabular nums, tight tracking, muted)
- `.eyebrow` (10px uppercase tracking 0.08em)
- `.rule-strong`, `.num-display`, `.tabular-nums`, `.scroll-slim` (square thumb)
- Status colors via `--status-success/warning/danger/info/neutral`
- Brand: primary = deep navy `#1F3A5F`; accent = teal `#0E7C86`

## Common components relied upon

- `SectionHeader` — now passed `index` ("01"…"07") and `eyebrow` props for Swiss hierarchy.
- `EmptyState`, `LoadingCard`, `PageContainer`, `StatusBadge` — unchanged.
- Existing shadcn/ui `Card`, `Button`, `Input`, `Label`, `Textarea`, `Avatar`, `Badge`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Slider`, `Checkbox`, `Separator`, `Table*`, `AlertDialog*`, `Dialog*`, `Select*`, `Skeleton`.

## Key changes per file

### 1. `initiatives-view.tsx`
- **Page header**: `.eyebrow` "Inisiatif & Penyelesaian Masalah" above H1, `pb-4 border-b border-border` hairline rule under header.
- **Status filter**: sharp `rounded-sm` segmented control; active state = `bg-foreground text-background` (Swiss inversion); each tab carries an `index-numeral` "01"…"04".
- **KPI cards**: `.card-flat rounded-md` (no shadow), `.index-numeral` + `.eyebrow` for label, big value styled with `.num-display .tabular-nums`. Icon container is sharp `rounded-sm` with hairline border.
- **Initiative cards**: `.card-flat rounded-md`, sharp avatars (`rounded-sm`), status badge uses `rounded-sm` + sharp dot indicator. Points shown in `.num-display .tabular-nums`. Expandable details divided by `.hairline-t` rule.
- **Impact level indicator**: replaced the Select dropdown with a 3-step horizontal bar — Kecil=5 · Sederhana=10 · Besar=20. Each segment is `rounded-none` (sharp). The active segment is filled with `bg-accent border-accent text-accent-foreground` (teal). Numbers shown large via `.num-display .tabular-nums`. Removed unused `Select*` imports.
- **Dinding Inisiatif (wall)**: card uses `.card-flat rounded-md`. Header is `bg-foreground` (Swiss solid block) with `eyebrow text-background/70` micro-label and Trophy icon. Each `WallCard` is hairline-bordered (`card-flat rounded-sm`), starts with index numeral + impact eyebrow line, big tabular points at the bottom in teal accent.
- **Create dialog**: dialog has `rounded-md`. Field labels use `.eyebrow`. All inputs/textareas are `rounded-sm`. Dialog body split into two sections — "Butiran Inisiatif" and "Impak & Bukti" — separated by a `.hairline-t pt-4` divider. Buttons are `rounded-sm`.
- **Verify form**: uses `.eyebrow` for the section label and inputs are `rounded-sm`.

### 2. `reports-view.tsx`
- **Page header**: `.eyebrow` "Laporan Prestasi" above H1, `pb-4 border-b border-border` hairline below. PeriodSelector sits to the right.
- **Tabs**: `TabsList` and `TabsTrigger` use `rounded-sm`.
- **KPI tiles**: already using `card-flat`; changed icon container to `rounded-sm` + hairline border; values use `.num-display .tabular-nums`; hint text now `tabular-nums`. Card is `rounded-md`.
- **Team table**: SectionHeader has `eyebrow="Pasukan"` `index="01"`. Headers use `.eyebrow` class. Rows are `border-b border-border/50` hairlines. Rank badge is `rounded-sm` with hairline border. Avatar `rounded-sm`. Score number uses `.num-display`. Export buttons are `rounded-sm`; the primary PDF button is `bg-foreground text-background hover:bg-foreground/90` (Swiss solid inversion).
- **Individual report header cards**: both cards are `card-flat rounded-md`. Avatars `rounded-sm`. Period chips are `rounded-sm` with hairline border, eyebrow micro-labels, tabular numbers.
- **6 dimension cards**: `DimensionCard` now accepts an `index` prop. Each row shows `01`-`06` index numeral + `.eyebrow` dimension name, large `.num-display .tabular-nums` score, and a sharp `rounded-none` horizontal bar (track AND fill both `rounded-none`, with hairline border). Auto/GM/Dinilai-GM badges are `rounded-sm` with hairline borders. Drill-down divider is `.hairline-t`.
- **Tasks/Initiatives/Acc ratings/GM note cards**: all `card-flat rounded-md`, eyebrow on section headers, sharp badges, hairline list dividers. GM note Textarea is `rounded-sm`. All section headers carry `eyebrow` + `index="02"…06`.
- **Staff selector** (GM mode): `card-flat rounded-md` panel, `.eyebrow` label, `rounded-sm` SelectTrigger.

### 3. `notifications-view.tsx`
- **Page header**: `.eyebrow` "Pusat Notifikasi" above H1, `pb-4 border-b border-border`. Unread count badge is `rounded-sm` with hairline border, `tabular-nums num-display` numbers. "Tanda Semua Dibaca" button is `rounded-sm` with hairline outline.
- **Filter tabs** (All / Unread / Read): replaced shadcn `Tabs` with a custom sharp `rounded-sm` segmented control wrapped in a hairline border. Active state = `bg-foreground text-background` (Swiss inversion). Each tab carries a small `tabular-nums` count. Removed unused `Tabs*` imports.
- **Notification rows**: each row is a flex item (not a Card) with hairline `border-b border-border/50` between rows inside a `card-flat rounded-md` parent. Layout:
  - **Left**: 2px-wide (`w-0.5`) status-colored vertical bar at the absolute left edge — color comes from a new `TONE_BAR` map (status-info/success/warning/danger/accent/neutral) — sharp, full height.
  - **Middle**: title (semibold for unread, medium for read) + message (regular) + timestamp in `.text-muted-foreground text-xs tabular-nums` + "Baharu" eyebrow.
  - **Right**: small sharp square `w-1.5 h-1.5 rounded-sm bg-primary` for unread; `ChevronRight` arrow for read.
- **Date grouping**: each group gets a SectionHeader with `eyebrow="Kumpulan"` and `index="01"…04` based on group order (today/yesterday/this_week/older).
- **Skeletons**: updated to match the new card-flat rounded-md container with sharp skeleton blocks.

### 4. `settings-view.tsx`
- **Page header**: `.eyebrow` "Tetapan Sistem" above H1, `pb-4 border-b border-border`.
- **Section tabs** (Pemberat Dimensi / Sasaran & Gred / Log Audit & Set Semula): `TabsList` is `rounded-sm bg-muted/30 border border-border p-0.5`. `TabsTrigger`s are `rounded-sm` (sharp segments).
- **Weights tab**:
  - Card `card-flat rounded-md`.
  - SectionHeader with `eyebrow="Pemberat & Sasaran"` `index="01"`.
  - Total bar: `rounded-sm` with hairline border; turns red border + red bg tint when invalid. Number uses `.num-display .tabular-nums`, red when not 100%.
  - Each dimension row: `.hairline-t pt-4 first:border-0` divider, `01`-`06` index numeral via `.index-numeral`, `.eyebrow` for dimension name, sharp slider track, tabular weight % on the right via `.num-display .tabular-nums`. Input is `rounded-sm`.
- **Targets tab**:
  - Initiative targets: card `card-flat rounded-md`, SectionHeader `eyebrow="Kategori & Sasaran" index="02"`. Labels are `.eyebrow`. Inputs `rounded-sm tabular-nums num-display`.
  - Grade bands: card `card-flat rounded-md`, SectionHeader `eyebrow="Gred" index="03"`. Each grade card is `rounded-sm card-flat` with hairline border. Grade letter is `rounded-sm` with hairline border + tabular nums. Each row has an `01`-`05` index numeral on the right via `.eyebrow tabular-nums`. Inputs `rounded-sm tabular-nums`.
  - Working days: card `card-flat rounded-md`, SectionHeader `eyebrow="Kalendar" index="04"`. Day toggles are sharp `<button>` with `rounded-sm` border; active = `bg-primary text-primary-foreground border-primary` (filled square). `Checkbox` marked `pointer-events-none` so the parent button is the click target.
  - Holidays: card `card-flat rounded-md`, SectionHeader `eyebrow="Kalendar" index="05"`. Date input + "Tambah" button `rounded-sm`. Holiday rows are `rounded-sm` with hairline border; dates shown in `.tabular-nums`.
  - Save bar button `rounded-sm`.
- **Audit tab**:
  - Audit log card now FIRST (above reset), `card-flat rounded-md`, SectionHeader `eyebrow="Log Audit" index="06"`. Table headers use `.eyebrow`. Rows are `border-b border-border/50` hairlines. Timestamp uses `.tabular-nums`. Action badge is `rounded-sm` with hairline border.
  - Reset danger card is now LAST, `card-flat rounded-md` with `border-status-danger/30`. SectionHeader `eyebrow="Pentadbiran Bahaya" index="07"`. A new warning alert (rounded-sm, danger tint) sits above the destructive action: "Amaran: Tindakan ini akan memadam semua data semasa…". The "Set Semula Data Demo" button is `rounded-sm border border-status-danger/40` (hairline-destructive). AlertDialog is `rounded-md`, buttons `rounded-sm`.

### 5. `profile-view.tsx`
- **Page header**: `.eyebrow` "Profil Pengguna" above H1, `pb-4 border-b border-border`.
- **Profile header card**: `card-flat rounded-md`. Avatar is sharp `rounded-sm` (no longer round) with a hairline border. Role badge uses `rounded-sm` + hairline border.
- **Account info section**: `dl` rows are now hairline-divided. `InfoRow` component accepts a `last?: boolean` prop; each non-last row has a `.hairline-b border-border` divider and `py-2.5` spacing. Label uses `.eyebrow` micro-style; value is `.tabular-nums` for dates and counts.
- **Edit form card**: `card-flat rounded-md`. SectionHeader with `eyebrow="Pengguna" index="01"`. Avatar color picker swatches are now `rounded-sm` squares (not round). All field labels use `.eyebrow`. All Inputs are `rounded-sm`; the hours and date inputs use `.tabular-nums` / `.num-display`.
- **Staff list quick-edit card** (GM): `card-flat rounded-md`. SectionHeader `eyebrow="Pengguna" index="02"`. Search input `rounded-sm`. Staff row cards are `rounded-sm card-flat`. Avatars `rounded-sm`. All sub-labels use `.eyebrow`, all sub-inputs `rounded-sm` + tabular where appropriate. Color swatches `rounded-sm`.
- **ProfileSkeleton**: skeleton cards use `card-flat rounded-md`, avatar skeleton is `rounded-sm`, input skeletons `rounded-sm`.

## What I deliberately did NOT touch

- All `useQuery`, `apiGet`, `apiPost`, `apiPatch`, `apiPut` calls and their query keys.
- All mutation handlers (`handleVerify`, `handleSave`, `handleReset`, `markRead`, `markAllRead`, `patchSelf`, `saveUser`, etc.).
- All Bahasa Malaysia copy (text content was preserved verbatim — only class names / DOM structure changed).
- All `"use client"` directives.
- No new packages installed.
- No files outside the five specified.
- Existing client-side `exportToCSV` / `exportToPDF` helpers in reports-view left untouched (only the UI layer around them changed).

## Quality checks

- `cd /home/z/my-project && bun run lint 2>&1 | tail -20` → **0 errors, 0 warnings**. Output is just `$ eslint .` with no follow-up lines.
- Dev server log shows repeated `✓ Compiled in 155-203ms` after each save — no compile errors, no runtime exceptions. `GET /api/notifications 200`, `GET /api/auth/me 200` confirms the app shell still loads and renders the Notifications view (and by extension the other refactored views) without crashing.
- No new ESLint-disable comments added; no `any` types introduced.

## Notes for downstream agents

- The `SectionHeader` component already supported `index` and `eyebrow` props (defined in `src/components/common/ui.tsx`); this task actually exercises them. The numerals appear on `sm+` screens only (per the existing `hidden sm:inline` in that component).
- For the notifications view, the previous `Tabs`/`TabsList` import was removed since the filter is now a custom segmented button group. If anyone re-adds Tabs there, they'll need to re-import.
- For the initiatives view, the unused `Select*` import was removed because the impact-level picker is now the 3-step horizontal bar.
- For the settings audit tab, the **order was flipped**: the audit log table is now first, the reset card is last. This matches the task spec ("place at bottom with a warning alert above it").
- For the profile view, the `InfoRow` helper now takes an optional `last?: boolean` — the last row (Status) is rendered without a bottom hairline divider.
- All five files still use the existing `cn` utility and the existing shadcn components — no custom CSS classes were added to `globals.css`. The Swiss tokens already in `globals.css` were sufficient.
