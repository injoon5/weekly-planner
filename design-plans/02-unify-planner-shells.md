# Unify Planner and SharedPlanner shells

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

One planner shell component owns scroll-lock, loading/error chrome, presence bridge, and surface mounting. Signed-in vs share differ only in data adapters and header slots — not in duplicated JSX trees.

## Evidence chain

- Surface: `/` (`Planner.jsx`) and `/s/:token` (`SharedPlanner.jsx`)
- Problem: both define `PLANNER_SCROLL_LOCK`, identical scroll-lock effect, parallel loading chrome, parallel `view(presence)` + `BoardPresenceBridge` + `EMPTY_PRESENCE` gates
- Owner: `src/components/Planner.jsx`, `SharedPlanner.jsx`, `PlannerProvider.jsx`, `BoardPresenceBridge.jsx`
- Scope: shell composition only — not share access state machine
- Uncertainty: none material; Instant room hooks still need a real board id before presence (bridge pattern stays)

## Design decision

Extract `PlannerChrome` (or expand `PlannerProvider`) that accepts:

- `status`: loading | error | ready
- `board`, `events`, runtime inputs
- `headerSlots` / render props for nav vs guest actions
- optional `presenceEnabled`

Signed-in path keeps workspace context. Share path passes `useSharedBoard` + `usePlannerRuntime` results into the same chrome. Delete duplicate scroll-lock constants.

Delete `BoardCanvas.jsx` — call `WeekGrid` from `PlannerSurface` with presence props directly (or rename if you want a stable export; do not keep a 6-line alias).

## Reuse

- `PlannerHeader`, `PlannerSurface`, `PrintDialog`, `BoardPresenceBridge` — keep
- `usePlannerRuntime` — keep as the shared runtime factory
- Exemplar: how `PlannerSurface` already shared between shells

## Changes

1. `src/components/PlannerChrome.jsx` (new)
   - Change: scroll-lock effect, loading/error/pending UI, presence gate, children/surface
   - Preserve: Korean loading copy / spinner styles from `planner.js`
   - Verify: both routes use it

2. `src/components/Planner.jsx`
   - Change: Provider + workspace → chrome + signed-in header clusters only
   - Preserve: BoardNav, ShareAction, TodosAction, AccountMenu wiring

3. `src/components/SharedPlanner.jsx`
   - Change: access gates (password, disabled) stay local; ready state renders chrome
   - Preserve: document.title effect, password form, viewer banner content
   - Verify: no second `PLANNER_SCROLL_LOCK` constant

4. `src/components/BoardCanvas.jsx`
   - Change: delete; update imports to `WeekGrid`
   - Preserve: prop names at call site (`presenceRoom` / `presenceColor`)

5. Docs under `docs/content/docs/codebase/` if they mention BoardCanvas / dual shells
   - Change: update architecture notes only after code lands

## Scope

- Inherit: all consumers of PlannerSurface
- Verify: print dialog still mounts once per shell
- Exclude: SharePanel UX, header icon declutter (plan `04`), style token work

## Validation

- Product: open own board and a share link; both scroll-lock; presence cursors when board id exists; print still works
- Interface: loading → ready on both routes; password gate still blocks chrome
- System: one definition of scroll-lock class string
- Repository: `npm run check` → pass

## Stop conditions

- Stop if share access states need fundamentally different layout trees (they don't today — only gated returns before the twin)
