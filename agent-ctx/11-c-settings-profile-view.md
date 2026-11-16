# Task 11-c — Settings View & Profile View

**Agent:** Code (frontend/fullstack)
**Feature:** Tetapan (GM-only) & Profil (semua pengguna) untuk EDUOASIS TASK360
**Files created:**
- `src/features/settings/settings-view.tsx` (export `SettingsView`)
- `src/features/settings/profile-view.tsx` (export `ProfileView`)

## What was built

Two production-ready client components in Bahasa Malaysia, Swiss design (sea blue #1F3A5F + teal #0E7C86 accent, status colors via CSS vars). Both views are wired into `src/components/layout/app-shell.tsx` (case `"settings"` → `<SettingsView />` for GM only, case `"profile"` → `<ProfileView />` for everyone).

---

### 1. `SettingsView` — Tetapan & Konfigurasi (GM-only)

Three tabs (shadcn `Tabs`):

**Tab 1 — "Pemberat Dimensi"**
- 6 dimension rows (Penyiapan Tugasan, Ketepatan Masa, Kualiti Kerja, Inisiatif & Penyelesaian, Komunikasi & Akauntabiliti, Produktiviti & Beban).
- Each row: Slider (0-100, step 1) + numeric Input (0-100) + live % readout.
- Live total bar at top: green when sum = 100% (valid), red when off.
- If total != 100, shows red AlertTriangle banner ("Baki X%") and Save button is disabled.
- Save button calls `PUT /api/settings` with full settings payload; toast on success/error; invalidates `["settings"]`, `["performance"]`, `["dashboard"]`.
- Defaults match API: 20/15/25/10/15/15.

**Tab 2 — "Sasaran & Gred"**
- `initiativeTargetMonthly` (default 20) and `initiativeTargetQuarterly` (default 60) numeric inputs.
- Grade bands editor (A-E) — each band card has color-coded letter chip + min/max inputs + BM label (Cemerlang/Baik/Memuaskan/Perlu Penambahbaikan/Kritikal).
- Working days checkboxes for Ahad-Sabtu (toggle with primary tint).
- Holidays list — add via `<input type="date">` + "Tambah" button; remove with trash icon. Empty state when none.
- Save bar at bottom calls `PUT /api/settings`; invalidates `["settings"]`, `["performance"]`, `["workload"]`, `["dashboard"]`.

**Tab 3 — "Log Audit & Set Semula"**
- **Reset card** (red border, ShieldAlert icon, danger description) with `<AlertDialog>` confirmation. Trigger button = destructive variant. Confirm action calls `POST /api/settings/reset`, shows success toast, then `qc.invalidateQueries()` + `window.location.reload()` after 900ms (seed resets users).
- **Audit log table** (`Table`/`TableHeader`/`TableBody`) inside `max-h-[520px] overflow-y-auto scroll-slim`. Columns: Masa (tabular-nums), Pelaku, Tindakan (color-coded badge by action keyword — UPDATE/CREATE/DELETE/APPROVE/etc.), Entiti, Butiran (truncated with title tooltip). Sticky header.

State: local form state synced from `useQuery(["settings"])` via `useEffect`. Uses `JSON.stringify` dirty check to enable/disable Save.

---

### 2. `ProfileView` — Profil Pengguna (GM + STAF)

**Profile header card** (1/3 width on desktop, full width on mobile):
- 96px avatar with `avatarColor` background, white initials via `AvatarFallback`.
- Name, role badge (GM with ShieldCheck icon, sea-blue; STAF with teal accent).
- Position, then separator + info list: E-mel, Jawatan, Jam/Minggu, Tarikh Mula, Status.

**Edit form card** (2/3 width):
- Avatar color picker — 8 preset swatches (#1F3A5F, #0E7C86, #8B5CF6, #E11D48, #0891B2, #16A34A, #EA580C, #64748B). Selected swatch shows white Check icon + ring offset. Clickable, ARIA `aria-pressed`.
- Editable fields: Nama (disabled for STAF), Jawatan (enabled for all), Jam/Minggu (disabled for STAF), Tarikh Mula (disabled for STAF). Each disabled field shows helper text "Hanya GM boleh ubah...".
- "Simpan Perubahan" button: enabled only when dirty; calls `PATCH /api/users` with diffed fields only; updates local zustand `user` after self-save; invalidates `["users"]`, `["performance"]`, `["workload"]`, `["dashboard"]`, `["tasks"]`.

**GM-only staff list** (`isGM`):
- Search input (name/position/email) with Search icon.
- Compact quick-edit row per staff: avatar, name Input, position Input, weeklyHours Input, color swatches row, Save button (only enabled when row is dirty).
- Uses `staffEdits: Record<string, EditState>` map synced from `users` query.
- Scrollable: `max-h-[640px] overflow-y-auto scroll-slim`.
- Empty state when no matches.

Skeleton loaders for both cards during `isLoading`.

---

## Quality checks

- `bunx eslint src/features/settings/settings-view.tsx src/features/settings/profile-view.tsx` → **0 errors, 0 warnings**.
- `bunx tsc --noEmit` → **0 errors** in both files (and providers.tsx).
- Dev server compiles cleanly: `GET /?view=settings 200`, `GET /?view=profile 200` (verified as GM user with session cookie).
- API responses verified: `/api/settings` returns 6 weights summing to 100% + grade bands A-E; `/api/audit` returns seed log; `/api/users` returns 7 users (1 GM + 6 STAF).

## Side fixes (pre-existing blockers, 1-line each)

To unblock the app-shell rendering (which statically imports all views), fixed two trivial pre-existing bugs:
- `src/features/performance/performance-view.tsx:30` — `useState` was imported from `framer-motion` (doesn't export it). Moved `useState` to `import { useState } from "react"` and kept `motion, AnimatePresence` from framer-motion. Also added missing `import { Input } from "@/components/ui/input"` (line 293 used `<Input>` without import).
- `src/components/providers.tsx` — used `<Tooltip.Provider>` (undefined property access). Changed to `<TooltipProvider>` (named export from `@/components/ui/tooltip`).

Remaining pre-existing errors (NOT in scope, NOT my files): `src/app/api/tasks/[id]/route.ts:22:297` (parsing error on a 297-char single line) and `src/components/layout/topbar.tsx:55` (setState-in-effect lint rule; also visible typo `const obileOpen` from a mangled edit). Both are out of scope for Task 11-c.

## Notes for downstream agents

- SettingsView is gated to GM-only in `app-shell.tsx` (`case "settings": return isGM ? <SettingsView /> : <AccessDenied />;`).
- ProfileView is open to all users.
- Both views use `useAppStore` to read `user` (and `setUser` to update self after profile save).
- All text is in Bahasa Malaysia; status colors come from CSS vars (`text-status-success/warning/danger/info`, `text-accent`, `text-primary`).
- No emojis used anywhere — used `Check` icon from lucide-react for the selected color swatch.
- All async actions show toast (sonner) + loading spinner (Loader2 with `animate-spin`).
- `animate-in-fade` provided by `PageContainer` wrapper.
- Long lists scroll within `max-h-...` with `scroll-slim` custom scrollbar.
