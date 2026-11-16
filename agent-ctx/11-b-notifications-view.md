# Task 11-b — Notifications View

**Agent:** Code (frontend/fullstack)
**Feature:** Notifications / Pusat Notifikasi view for EDUOASIS TASK360
**File created:** `src/features/notifications/notifications-view.tsx`

## What was built

A complete, production-ready client component `export function NotificationsView()` for the Notifications feature, fully in Bahasa Malaysia, Swiss design (sea blue #1F3A5F + teal #0E7C86 accent, status colors via CSS vars). No indigo/blue.

### Sections
1. **Page header** — Bell icon tile (teal-tinted), "Pusat Notifikasi" eyebrow, title "Notifikasi" with a danger-toned unread-count badge ("N belum dibaca") when `unreadCount > 0`, subtitle "Kemaskini tugasan, tarikh akhir, dan aktiviti penting pasukan anda.". A "Tanda Semua Dibaca" outline button (CheckCheck icon) shown only when `unreadCount > 0` — calls `POST /api/notifications/read-all`, invalidates `["notifications"]`, success toast.
2. **Filter tabs** — `Tabs` with three triggers: **Semua | Belum Dibaca | Dibaca**. Each trigger shows a small count chip (total / unread-count-in-danger / read-count). State held in `useState<NotifFilter>`; query key is `["notifications", filter]` per spec.
3. **Notification list** grouped by date bucket — **Hari Ini | Semalam | Minggu Ini | Lebih Lama** (computed client-side via `groupKey()` using midnight boundaries). Each group renders a `SectionHeader` (label + "N notifikasi" subtitle) then the rows. Long list wraps in `max-h-[calc(100vh-280px)] overflow-y-auto scroll-slim`. `AnimatePresence` + `motion.div` with `layout` for smooth group transitions.
4. **Notification row (NotifRow)** — Card with:
   - 36px icon tile colored by type (see mapping below).
   - Title (bold when unread, medium when read), 2-line clamped message (`line-clamp-2`), relative time (`relativeTime`) + tooltip with full `formatDateTime`.
   - Unread state: teal (`bg-oasis-teal`) 4px left border, `bg-accent/[0.04]` highlight, animated teal dot + "Baharu" label, pulsing accent dot.
   - Read state: muted opacity 80%, brightens on hover.
   - ChevronRight on the right for affordance.
   - Click / Enter / Space → `markRead()` which calls `PATCH /api/notifications/[id]/read` then navigates per `link` field, then invalidates queries. Read items skip the API call and just navigate.
   - Fully keyboard-accessible (`role="button"`, `tabIndex={0}`, aria-label).
5. **Empty state** — Card wrapping `EmptyState` with context-aware copy per filter (no unread / no read / no notifications), icon `BellOff` for "read" tab, `Bell` otherwise.
6. **Loading skeletons** — Three skeleton groups each with a `SectionHeader` placeholder + two skeleton rows (icon tile + 3 text lines), mirroring real layout.

### Type → icon + color meta
- `task_assigned` → UserPlus (accent/teal)
- `deadline_soon` → Clock (warning)
- `deadline_passed` → Clock (danger)
- `task_returned` → RotateCcw (warning)
- `comment_new` → MessageSquare (info)
- `blocker_reported` → AlertTriangle (danger)
- `initiative_submitted` → Lightbulb (info)
- `initiative_verified` → Lightbulb (success)
- `extension_request` → Hourglass (warning)
- `quality_reviewed` → Star (success)
- `task_review` → CheckCircle2 (info)
- `accountability_rated` → Award (success)

Tone → Tailwind classes map uses `text-status-*` + `bg-status-*/10` (no indigo/blue), plus `text-oasis-teal bg-oasis-teal/10` for accent.

### Data layer
- `useQuery(["notifications", filter])` → `GET /api/notifications` returns `{ notifications, unreadCount }`.
- Client-side filtering by `read` flag drives the tab content (the endpoint returns the full set).
- `markRead(n)` → `apiPatch("/api/notifications/{id}/read")` then `qc.invalidateQueries({ queryKey: ["notifications"] })`.
- `markAllRead()` → `apiPost("/api/notifications/read-all")` then full invalidate + sonner success toast.
- Errors surfaced via sonner `toast.error`.
- `staleTime: 15s` to balance freshness vs refetch.

### Navigation (uses `useAppStore` setters)
`navigateFromLink(link, setView, setSelectedTaskId, setSelectedStaffId)` parses the link's query string:
- `view=tasks` → `setView("tasks")` (+ `setSelectedTaskId(id)` if `id` present).
- `view=initiatives` → `setView("initiatives")`.
- `view=performance` → `setView("performance")` (+ `setSelectedStaffId(staffId)` if present).
- Malformed links silently ignored (try/catch).

### UI/UX details
- Responsive: header wraps on mobile, icon tile hidden on `xs`, tab list is horizontal-scrollable via shadcn default. Long list scrolls with `scroll-slim` custom scrollbar.
- `PageContainer` wrapper provides `animate-in-fade` on mount.
- Touch targets ≥ 36px icon tile, full card click target.
- Semantic HTML (`Card` with `role="button"`), ARIA labels, keyboard activation.
- No new dependencies; only existing shadcn/ui components, lucide-react icons, framer-motion, sonner, react-query, zustand.

## API contract used
- `GET /api/notifications` → `{ notifications: Notification[], unreadCount: number }`
- `PATCH /api/notifications/[id]/read` — mark single as read (no body needed)
- `POST /api/notifications/read-all` — mark all as read

## Quality checks
- `bun run lint`: **0 errors in this file**. The 3 remaining lint errors live in pre-existing/other-agent files: `src/app/api/tasks/[id]/route.ts` (parsing), `src/components/layout/topbar.tsx` (set-state-in-effect), `src/features/performance/performance-view.tsx` (undefined `Input`).
- `npx tsc --noEmit`: **0 errors for this file** (grep on `notifications-view` returned no output).
- Dev server: the prior `Module not found: '@/features/notifications/notifications-view'` error has cleared — the error trace now advances past line 14 (notifications-view) to line 15 (`@/features/settings/settings-view`), confirming my module is resolvable and compiles cleanly.

## Notes for downstream agents
- This view is already wired into `src/components/layout/app-shell.tsx` (case `"notifications"` → `<NotificationsView />`). No changes to other files were needed.
- The notification center bell in `topbar.tsx` (separate component) independently polls `["notifications", user.id]`; both share the same backend endpoint and will be kept in sync via react-query cache as long as both use overlapping query keys. If a future refactor wants strict cross-invalidation, change the topbar queryKey to `["notifications"]` (without the user.id suffix) to match this view's key namespace.
- All UI text is in Bahasa Malaysia; status colors strictly use `--status-*` / `--oasis-*` tokens (no indigo/blue).
