# Task 3+4 — Login Screen + Layout Shell Swiss Refinement

**Agent**: Frontend Swiss refinement (login + layout shell)
**Scope**: `src/features/login/login-screen.tsx`, `src/components/layout/{sidebar,topbar,mobile-nav,app-shell}.tsx`
**Constraint**: Do not touch dashboard / tasks / performance / etc. — handled by parallel agents.

## Files edited

1. `/home/z/my-project/src/features/login/login-screen.tsx`
2. `/home/z/my-project/src/components/layout/sidebar.tsx`
3. `/home/z/my-project/src/components/layout/topbar.tsx`
4. `/home/z/my-project/src/components/layout/mobile-nav.tsx`
5. `/home/z/my-project/src/components/layout/app-shell.tsx`

## Key changes

### Login screen
- Wrapped "telus & berasaskan data" segment in a `whitespace-nowrap` span so the ampersand never orphans at line end.
- Removed decorative bottom-left blur orb; kept ONE top-right orb at lower opacity (`bg-accent/10`).
- Added a thin teal hairline `border-r border-accent/30` on the left brand panel as a structural Swiss divider (in addition to the residual orb).
- Brand icon tile: `rounded-lg bg-accent shadow-lg` → `rounded-sm bg-accent` (no shadow).
- Brand area eyebrow text uses the `.eyebrow` utility for "AL AMIN EDU OASIS".
- 3 feature bullets:
  - Each icon now `w-3.5 h-3.5` inside a `w-7 h-7 rounded-sm border border-primary-foreground/20` hairline tile (no background tint).
  - Prepended index numerals "01", "02", "03" using `.index-numeral text-primary-foreground/40 tabular-nums`.
- Footer line: bumped opacity `text-primary-foreground/50` → `/70` and added `tabular-nums`.
- Card corners sharpened: added `rounded-md` to the `Card` (in addition to `card-flat`).
- All inputs and the submit button: `rounded-sm`.
- Labels: use `.eyebrow text-muted-foreground` (was custom uppercase tracking).
- Demo buttons:
  - `flex-col` icon-above-label removed → `flex items-center justify-center gap-2` (icon inline-left).
  - Sharp corners `rounded-sm`, explicit `border-border`, hover `bg-muted/40`.
- Demo info box corners sharpened `rounded-sm`; password "demo123" gets `tabular-nums`.
- Divider: replaced absolute-positioned label with a clean `flex items-center gap-3` containing two `border-t border-border flex-1` rules around an `.eyebrow` label "LOG MASUK PANTAS UNTUK DEMO" (vertically aligned with the rules).

### Sidebar
- Logo tile: `rounded-lg ... shadow-sm` → `rounded-sm` (no shadow).
- Eyebrow above nav list: `"Menu Utama"` promoted to `.eyebrow` with a `tabular-nums` "01" prefix.
- Nav buttons: `rounded-md` → `rounded-sm`; added `border-l-2 border-transparent` baseline. Active state adds `border-l-primary` (hairline left rule accent) in addition to the bg.
- Active indicator dot (`w-1.5 h-1.5 rounded-full`) replaced with a structural `w-1 h-4 bg-primary` vertical bar.
- Bottom "Peringatan" box: `rounded-md bg-muted/40` → `rounded-sm border border-border bg-muted/30` (sharper + hairline).

### Topbar
- All interactive elements sharpened to `rounded-sm` (mobile menu trigger, theme toggle, notification bell trigger, user-menu trigger, avatar fallback, popover content, dropdown content).
- Notification unread badge: `rounded-full` → `rounded-sm` (sharper square indicator); added `tabular-nums`.
- Page title area: added an `.eyebrow` micro-label "Bahagian" above the H1.
- User menu role label: replaced custom uppercase with `.eyebrow`.
- Topbar uses `border-b border-border` hairline (was already hairline — verified, no shadow).

### Mobile nav
- Nav buttons: `rounded-md` → `rounded-sm`.
- Active state: now uses a 1px `border border-border` hairline + `bg-muted/50` fill (replacing the pill/underline look).
- Bottom nav container already had `border-t border-border` hairline — verified.

### App shell footer
- Footer keeps `border-t border-border bg-muted/30` hairline.
- Version label split into `.eyebrow` "Versi Prototaip" + `tabular-nums` "v1.0" + classification text, for the Swiss numerals/eyebrow treatment.

## Functionality preserved (verified unchanged)
- `handleLogin`, `handleQuick`, demo credentials info box, `motion` animations.
- Sidebar: `setView`, `setSelectedTaskId`, role-based filtering.
- Topbar: notifications query, `markAllRead`, `markRead`, `gotoNotif`, theme toggle, logout, mobile sheet.
- Mobile nav: `setView`, `onNavigate`.
- App shell: view routing, GM role gates, background notifications refetch.

## Lint result
```
$ eslint .
(no output — passed clean)
```
0 errors, 0 warnings.

## Note for next agent
- The `swiss-grid` utility, `.eyebrow`, `.index-numeral`, `.card-flat`, `.hairline-*`, `.scroll-slim` helpers all live in `src/app/globals.css` (defined by the design-system agent). Use them — do not redefine.
- Radius scale: `--radius-sm: 3px`, `--radius-md: 4px`, `--radius-lg: 6px`. Prefer the literal `rounded-sm` / `rounded-md` Tailwind tokens which now resolve through this scale (sharp, not rounded).
