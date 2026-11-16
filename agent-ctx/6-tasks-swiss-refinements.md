# Task 6 — Tasks module Swiss design refinements

**Agent:** Code (frontend)
**Feature:** Swiss design treatment applied across the Tasks module (Kanban + List + Detail + Form)
**Files edited (all inside `/home/z/my-project/src/features/tasks/`):**

1. `tasks-view.tsx`
2. `tasks-kanban.tsx`
3. `tasks-list.tsx`
4. `task-detail.tsx`
5. `task-form-dialog.tsx`

## Design system used (already in `globals.css`)

- Radius scale: `--radius-xs 2px`, `--radius-sm 3px`, `--radius-md 4px`, `--radius-lg 6px`, `--radius-xl 8px` (sharp, not rounded).
- `.card-flat` = 1px hairline border + no shadow.
- `.eyebrow` = 10px uppercase, tracking 0.08em, muted-foreground, weight 600.
- `.tabular-nums` = `font-variant-numeric: tabular-nums` (already on `table`).
- `.hairline-t/-b/-l/-r` = 1px border with `--border`.
- `.scroll-slim` = thin scrollbar, square thumb (radius 0).
- Status tokens: `--status-success/-warning/-danger/-info/-neutral`.
- Brand: primary = deep sea blue, accent = teal.

## Key changes per file

### 1. `tasks-view.tsx`
- Added `.eyebrow` micro-label "Mod Pengurusan Tugasan" above the H1.
- Wrapped page header in `hairline-b pb-4` rule to anchor the title block Swiss-style.
- Mode toggle (Kanban / Senarai) is now `rounded-sm` with `.card-flat` container; active state is a hairline border (`border-border-strong`) on a `bg-background` cell instead of `shadow-sm`.
- Added `tabular-nums` and `aria-pressed` to the toggle buttons.
- Kept `"use client"`, data fetching, store wiring, and Bahasa Malaysia text unchanged.

### 2. `tasks-kanban.tsx`
- `COLUMNS` rewritten to use CSS-variable accent colors (`var(--status-*)`) instead of `border-t-*` class strings.
- Added `PRIORITY_BAR` map for the 2px left vertical bar color on each card (Rendah/Sederhana/Tinggi/Segera).
- **Column container**: hairline-based — outer grid uses `border border-border card-flat rounded-md`; each column gets `border-r border-border` (last column skipped). Dropped `rounded-lg`, dropped `bg-muted/30` column tint, dropped `ring-2 ring-accent/30` drop highlight in favor of subtle `bg-accent/5`.
- **Column header**: eyebrow status name + tabular count badge inline ("BELUM MULA · 4"). 2px top accent rule (status color), hairline bottom border between header and body. No colored pill for count.
- **Task cards**: `card-flat rounded-sm p-3 pl-4` with 2px left vertical bar in priority color via inline style (`borderLeftColor` / `borderLeftWidth: 2`). Hover changes border to `border-border-strong`. Drag state shows `opacity-50 ring-1 ring-accent/30` (no `shadow-lg`).
- **Drag handle**: `GripVertical` icon at top-right of card, muted color (`text-muted-foreground/50`).
- **Priority badge**: kept as small inline `rounded-sm border` chip top-right, with priority color border + text.
- **Progress bar** inside card: `h-1 rounded-sm` (was `rounded-full`).
- **Filter bar**: `card-flat rounded-md p-2.5`, with a leading `eyebrow` "Cari" label; all inputs/selects `rounded-sm`, `focus-visible:ring-1`. Reset button gets `border border-transparent hover:border-border rounded-sm`.
- Added tabular-nums on link counts, day counts, dates.
- Removed unused imports (`Card`, `ChevronRight`, `DragOverlay`, `TASK_STATUS_META`).
- `"use client"`, `@dnd-kit` behavior, mutations, all Bahasa Malaysia text preserved.

### 3. `tasks-list.tsx`
- **Table card**: `card-flat rounded-md` instead of plain `<Card>`. Loading skeleton also `card-flat rounded-md`.
- **Table header row**: `eyebrow border-b border-border bg-muted/30` with `py-2 px-3` (tightened from `py-2.5`). Th cells use `font-semibold`.
- **Table rows**: `border-b border-border/50 hover:bg-muted/30` (verified).
- **Progress column**: progress bar `rounded-sm` (was `rounded-full`), with explicit `tabular-nums` percentage label next to the bar.
- **Priority badge**: `rounded-sm border` (was `rounded`) and now passes `prioMeta.border` token.
- **Status badge**: `rounded-sm border` (was `rounded-md`), with status dot as `rounded-sm` (was `rounded-full`).
- **Date column**: `tabular-nums` everywhere; overdue `(Nh lewat)` text also tabular.
- **Action buttons** (Pencil / Trash): `rounded-sm`, with `aria-label="Edit"` / `"Padam"`.
- **AlertDialog**: `rounded-md` content, `rounded-sm` cancel/delete buttons.
- **Local filter bar**: same Swiss treatment as kanban's filter bar (`card-flat rounded-md`, eyebrow "Cari" label, `rounded-sm` inputs, hairline reset button).
- Removed unused `idx` from `tasks.map((t, idx) => ...)`.
- Imports, validation, mutation logic, and BM text preserved.

### 4. `task-detail.tsx`
- **Sheet header**: added `.eyebrow` line above the title showing `category / priority / kerumitan N/3` with `/` separators and tabular numbers; added `tracking-tight` to title.
- **Avatar / status badge**: avatars `rounded-sm` with `borderRadius: 2` inline fallback. Status badge now `rounded-sm border` with status dot as `rounded-sm` (was `rounded-md` + `rounded-full`).
- **Date displays** in header, comments, logs, history: all `tabular-nums`.
- **Action button row**: every Button now has `rounded-sm` className override.
- **Progress section**: label uses `.eyebrow`, percentage value bumped to `text-sm font-semibold tabular-nums`.
- **Tabs**: Swiss underline style — `TabsList` is `bg-transparent border-b border-border rounded-none p-0 h-9 w-full grid grid-cols-4 gap-0`. Each `TabsTrigger` is `rounded-none border-b-2 border-transparent` with `data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none` (overrides shadcn's default bg fill + shadow). Tab labels dropped `mr-1` in favor of `gap-1`.
- **Comments tab**: each comment is now a `border-l-2 border-border pl-3 py-1` thread — author name in semibold, body in regular leading-relaxed, GM tag as `rounded-sm border-primary/30 bg-primary/5 text-primary` chip. Timestamp right-aligned in `text-[10px] text-muted-foreground tabular-nums`. Removed the bubble background entirely. Send button is `rounded-sm`.
- **Blockers tab**: open blocker card `rounded-sm border-status-danger/30 bg-status-danger/5`; type label uses `.eyebrow .text-status-danger`. Resolved blocker card `rounded-sm`. "Tanda Selesai" button `rounded-sm`.
- **Log Masa tab**: each entry is a hairline row (`border-b border-border/50`) with `tabular-nums` on hours and date (was a `rounded-md bg-muted/30` chip). Jumlah row uses `border-t-2 border-border-strong` with `.eyebrow` label.
- **Sejarah tab**: vertical timeline implemented as `<ol>` with `before:absolute before:left-[3px] before:top-1 before:bottom-1 before:w-px before:bg-border` (1px hairline rule connecting entries). Each entry is a `<li class="pl-4">` with an absolute-positioned `rounded-sm bg-accent` 1.5px square marker.
- **Quality review display**: wrapped in `eyebrow` "Penilaian Kualiti GM" label with star icon; ratings grid uses `.eyebrow` for dimension labels; comment block uses `border-l-2 border-border pl-2 italic`.
- **Extension requests**: wrapped in `eyebrow` "Permintaan Lanjutan Tarikh" with `border-t border-border` divider; each entry `rounded-sm border` with status chip `rounded-sm border` and tabular date.
- All four sub-dialogs (BlockerDialog, TimeLogDialog, QualityReviewDialog, ExtensionDialog): DialogContent `rounded-md`, DialogTitle `tracking-tight`, all Labels switched to `.eyebrow`, all inputs/selects/Textareas/buttons `rounded-sm`. Rating buttons in QualityReviewDialog changed from `rounded` to `rounded-sm border` (square rating tiles).
- All Bahasa Malaysia text preserved. Sheet/skeleton imports, mutations, permission gating untouched.

### 5. `task-form-dialog.tsx`
- DialogContent `rounded-md`; DialogTitle `tracking-tight`.
- Form restructured into three sections with `.eyebrow` section labels and `hairline-t pt-4` dividers:
  1. **Asas** — Tajuk, Penerangan, Tugaskan Kepada, Kategori, Keutamaan, Tarikh Mula, Tarikh Akhir.
  2. **Pemberat & Kerumitan** — Kerumitan, Anggaran Jam.
  3. **Lampiran** — Pautan Lampiran chips.
- All Labels switched from `text-xs font-medium` to `.eyebrow` (10px uppercase tracked).
- All inputs / selects / Textareas: `rounded-sm` + `focus-visible:ring-1 focus-visible:ring-ring`.
- Number / date inputs: `tabular-nums` (Anggaran Jam, Tarikh Mula, Tarikh Akhir).
- "Add link" outline Button: `rounded-sm`. "Tugasan Peribadi" panel: `rounded-sm border border-border bg-muted/30` instead of `rounded-md bg-muted/40`.
- Submit + Cancel buttons: `rounded-sm`.
- Lampiran chips (Badge): `rounded-sm border border-border tabular-nums` with `aria-label="Buang lampiran"` on the remove button.
- Form layout tightened: previously a 3-col grid for Kerumitan/Anggaran/Tarikh Mula was restructured into a 2-col layout (Tarikh Mula moved into the Asas section beside Tarikh Akhir, since both are dates).
- All validation logic (title/assignee/dueDate required) preserved; all mutations (`apiPost`/`apiPatch`) preserved; all Bahasa Malaysia text preserved; `"use client"` preserved.

## Quality checks

- `cd /home/z/my-project && bun run lint` → exit code 0 (no errors, no warnings).
- Dev server compiles cleanly (`✓ Compiled in XXXms` lines in `dev.log`, no type errors or runtime errors).
- No files outside `/home/z/my-project/src/features/tasks/` were touched.
- No new packages installed.
- All `"use client"` directives preserved.
- All Bahasa Malaysia UI text preserved verbatim.

## Notes for downstream agents

- The `useFilters()` hook and the kanban's `TaskFiltersBar` are exported from `tasks-kanban.tsx` and shared with `tasks-list.tsx` via import. Both files now have visually-consistent Swiss filter bars.
- The Kanban card's 2px left priority bar uses inline `style={{ borderLeftColor: prioColor, borderLeftWidth: 2, borderLeftStyle: "solid" }}` because priority colors come from CSS variables in `PRIORITY_BAR`; this also keeps `.card-flat`'s hairline intact on the other three sides.
- The Tabs Swiss underline is achieved purely through className overrides on `TabsList` / `TabsTrigger` — the `@/components/ui/tabs` shadcn primitive was NOT modified (it lives outside the tasks feature folder).
- History timeline uses Tailwind's `before:` pseudo-element with `w-px bg-border` for the 1px vertical rule, so it scales to any number of entries.
