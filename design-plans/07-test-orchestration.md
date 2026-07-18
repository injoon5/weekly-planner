# Test Instant orchestration, not just kernels

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

High-risk hooks and ensure/migrate paths have regression tests (pure extractions cores first, then thin hook tests with mocked Instant). Stop pretending `workspace-bootstrap.js` coverage equals workspace safety.

## Evidence chain

- Surface: workspace boot, share actions, event mutations, editor session
- Problem: kernels tested; `useWorkspace` / `useShareActions` / `useSharedBoard` / `useEventMutations` / `useEditorSession` / `workspace-ensure.js` untested
- Owner: `src/hooks/*`, `src/board/workspace-ensure.js`, `test/*`
- Uncertainty: Instant client mocking style — prefer extracting pure functions over heavy React Testing Library if the repo has no RTL yet

## Design decision

1. Inventory: confirm whether Vitest+RTL exists; if not, **extract** decision logic from hooks into pure modules (same pattern as `share-access.js` / `workspace-loading.js`) and unit-test those.
2. Priority extractions tests:
   - `workspace-ensure` migration branches (legacy localStorage → Instant)
   - share action command sequencing (enable link → set password → rotate) as pure tx builders
   - editor session draft/cancel invariants (no orphan create)
3. Add 1–2 integration-style tests only where pure extraction is dishonest (e.g. hydrate `roleKnown` until plan `01` deletes it).
4. Do not chase 100% hook coverage — chase the Instant write paths.

## Reuse

- Exemplars: `test/policies.test.js`, `test/shared-board.test.js`, `test/workspace-loading.test.js`
- `command-result` + tx builders in `src/db/tx/*`

## Changes

1. Extract pure helpers from `workspace-ensure.js` / `useShareActions.js` / `useEditorSession.js` where needed
2. New tests under `test/` mirroring those names
3. Optionally delete over-extracted `workspace-bootstrap.js` if it's only a test seam — fold back if extraction is real elsewhere

## Scope

- Exclude: visual snapshots; E2E Playwright unless already in repo
- Verify: `npm test` time stays reasonable

## Validation

- Repository: `npm run test` → pass; new tests fail if dual editor-link txs regress (coordinate with plan `01`)
- Product: no runtime change required for this plan alone

## Stop conditions

- Stop if testing requires a live Instant app — use mocks/fakes only
- Stop if plan `01` is mid-flight — write tests against the post-collapse model instead of locking dual-truth in
