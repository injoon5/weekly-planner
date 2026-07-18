# Header declutter + one overlay grammar

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

Planner chrome has a clear primary action cluster and overflow for secondary tools. Dense settings use one overlay pattern (Sheet on mobile / consistent desktop shell). Share admin is not trapped in a 264px popover.

## Evidence chain

- Surface: signed-in planner header (`PlannerHeader.jsx`, `Planner.jsx`) + overlays
- Problem: icon landfill (presence, account, upgrade, todos, share, theme, more, print); SharePanel (403) in MenuPopover; TodoPanel reimplements Sheet's Dialog/Drawer split; Print is a heavy parallel form
- Owner: `PlannerHeader.jsx`, `ShareAction.jsx`, `SharePanel.jsx`, `TodoPanel.jsx`, `MoreMenu.jsx`, `PrintDialog.jsx`, `ui/Sheet.jsx`
- Scope: information architecture + overlay shell reuse — not sharing permission model (plan `01`)
- Uncertainty: product preference for Share as sheet vs full-page — default to Sheet/wide dialog matching Editor/Print

## Design decision

**Header IA**
- Keep visible: board nav, primary create/edit affordance (implicit in grid), one collaboration entry (Share), account/presence
- Move to overflow (`MoreMenu` or equivalent): import/export, tutorial copy, print, view toggles that aren't session-critical
- Theme: keep one control — prefer account page + overflow, or a single header toggle — not both competing with Share/Todos

**Overlay grammar**
- All dense panels (Editor, Print, Todos, Share admin, Upgrade) go through `ui/Sheet.jsx` (or a thin wrapper)
- MenuPopover reserved for short action lists (board tab menu, account quick links) — not 400-line forms
- TodoPanel deletes its hand-rolled Dialog/Drawer and uses Sheet
- ShareAction opens Sheet (or large dialog) instead of MenuPopover

**Print**
- Collapse prefs: reuse board name + date range already on the board; only keep toggles that change printed ink (memos / times / empty labels). Kill duplicate meta fields that mirror header state.

**Landing (related, lighter touch)**
- Brand name must be hero-level on first viewport; slogan secondary. Dead `BrandMark` `large`/`markLg` — either use or delete.

## Reuse

- `ui/Sheet.jsx` + `sheet.js` — the standard shell
- `HoldToConfirm.jsx` — keep for destructive actions
- Exemplar density: Editor sheet (already the right pattern)

## Changes

1. `src/components/Planner.jsx` / `PlannerHeader.jsx`
   - Change: regroup slots; fewer always-visible icon buttons; labels strategy that doesn't become icon scavenger hunt on mobile (consider a single "메뉴" sheet on small screens)
   - Preserve: Korean aria-labels; presence avatars discoverability

2. `src/components/ShareAction.jsx` + `SharePanel.jsx`
   - Change: mount SharePanel in Sheet; widen layout for member tables
   - Preserve: all share/member operations

3. `src/components/TodoPanel.jsx`
   - Change: use Sheet; delete duplicate breakpoint shell
   - Preserve: today checklist behavior + empty state copy

4. `src/components/PrintDialog.jsx` + `usePrintSetup.js` + `print-prefs.js`
   - Change: simplify prefs to non-duplicative toggles; keep reliable `window.print()` trigger
   - Preserve: print CSS that already works

5. `src/components/MoreMenu.jsx`
   - Change: absorb relocated secondary actions; shorten tutorial wall of text (link to docs or first-run only)
   - Preserve: import/export

6. `src/components/Landing.jsx` (optional same PR or follow-up)
   - Change: brand hierarchy; delete unused `markLg`/`large` API
   - Preserve: guest funnel + magic-code path

## Scope

- Inherit: SharedPlanner header (fewer actions already — keep simpler)
- Verify: mobile 560 sheet path, desktop dialog path
- Exclude: StyleX token extraction (plan `03`); sharing dual-truth (plan `01`); Account.jsx split (plan `05`) beyond what's needed for theme placement

## Validation

- Product: can share, check todos, print, switch theme, import/export without hunting
- Interface: 375w and 1280w; Share sheet usable with 3+ members; no MenuPopover taller than viewport for admin
- System: one mobile sheet breakpoint constant shared with Sheet
- Repository: `npm run check` → pass

## Stop conditions

- Stop if "declutter" removes Share/Todos from reachability without an obvious overflow entry
- Stop if Print simplification breaks Korean worksheet headers schools rely on — keep memo/time toggles
