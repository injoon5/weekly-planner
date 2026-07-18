# Fix plans index

Plans live next to the roast in `design-plans/`. Executors should treat each plan as self-contained.

| ID | File | Priority | Kind |
|----|------|----------|------|
| 00 | `00-ROAST.md` | — | Diagnosis |
| 01 | `01-collapse-sharing-dual-truth.md` | P0 | Architecture |
| 02 | `02-unify-planner-shells.md` | P0 | Architecture |
| 03 | `03-stylex-primitive-layer.md` | P2 | Design system |
| 04 | `04-header-and-overlay-grammar.md` | P1 | UI IA |
| 05 | `05-split-god-files.md` | P2 | Maintainability |
| 06 | `06-api-layer-cleanup.md` | P2 | Server hygiene |
| 07 | `07-test-orchestration.md` | P3 | Safety net |
| 08 | `08-kill-legacy-duals.md` | P1 | Architecture |

## Suggested sequence

1. `02` (safe, immediate dual-edit win)
2. `01` + `08` (delete dual systems; test as you go)
3. `04` (user-facing chrome)
4. `05` → `03` (split then tokenize)
5. `06` anytime
6. `07` in parallel with `01`/`08` so refactors stick

TypeScript debt explicitly out of scope.
