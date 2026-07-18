# Weekly Planner — Brutal Roast

Written against: `00771d4c053a501914a53a668039f502d3751cc`

TypeScript concerns are out of scope (per request). This is architecture, product surface area, UI organization, and maintainability.

---

## What this app actually is

A Korean weekly timetable with magic-code auth, realtime Instant sync, drag/resize events, print, and dark mode. Then someone bolted on: password share links, invited members, presence cursors, a bearer-token REST API, OG image cards, guest upgrade, API tokens on the account page, and a Fumadocs site. The grid core is competent. Everything around it is a second product wearing a planner costume.

---

## The roast

### 1. You built Slack permissions for a sticky-note calendar

`members.role` is a **display cache**. `boards.editors` is **write truth**. That sentence in `src/sharing/member-policy.js` is the entire architecture confession:

> Write authority = boards.editors link; members.role is display cache.

So every role change is a dual write. Every hydrate race needs `roleKnown` so owners don't flash a viewer banner. You have three near-identical enums (`MEMBER_ROLE`, `SHARE_ROLE`, `BOARD_ROLE`) in `roles.js` because Instant's link model and your UI model refuse to be the same thing.

On top: open vs password shares, PBKDF2 + legacy SHA-256, `editSecret` vs `secret`, guest `ruleParams`, invite via admin SDK, and a SharePanel that's 403 lines of membership admin stuffed into a 264px popover.

For a **personal weekly planner**.

If 90% of boards are owner-only, you paid enterprise collab rent for a feature that should be "copy link, maybe password." The cognitive load of this repo is not "blocks on a week." It's "who can write, via which secret, after which hydrate."

**Fix plan:** `01-collapse-sharing-dual-truth.md`

---

### 2. StyleX files are bigger than the UI they style

| File | Lines |
|------|------:|
| `styles/grid.js` | 671 |
| `styles/landing.js` | 637 |
| `styles/planner.js` | 583 |
| `styles/account.js` | 439 |
| `styles/menus.js` | 394 |
| `styles/todos.js` | 391 |

`src/styles/` ≈ **4311** lines. `src/components/` ≈ **4971**. The design system is a folder of screen dumps. `tokens.stylex.js` is 66 lines of colors + slot vars and then every feature invents its own spacing, radii, and hard-coded `#E96D4F` / `#4E9EDB`.

`breakpoints.js` documents media queries that **cannot** be imported into `stylex.create`, so every file re-pastes `720px` / `560px` / `760px`. Layout geometry (`slotH`, `gutW`) is smuggled through StyleX vars into JS so the grid's truth lives in the styling layer. Plus `base-ui.css` + `palette.css` + `app.css` because StyleX wasn't enough answers to "where is the style?"

**Fix plan:** `03-stylex-primitive-layer.md`

---

### 3. Dual sources of truth as a lifestyle

| Concern | Path A | Path B |
|---------|--------|--------|
| Can edit? | `members.role` | `boards.editors` |
| Share password | PBKDF2 + salt | legacy SHA-256 |
| API token hash | peppered | unpeppered legacy |
| View prefs | Instant `boardPrefs` | `sessionStorage` guests |
| Theme | Instant `settings.theme` | `localStorage` |
| Rate limits | Instant `$rateLimits` | in-memory REST bucket |
| Structured prefs | Instant fields | JSON-in-string (`colorLabels`, `hiddenColors`) |

Legacy paths are kept "until rotate." Rotate never happens. Tests carefully preserve both hashes. You're not migrating — you're running a museum.

**Fix plan:** `08-kill-legacy-duals.md` (+ sharing plan for roles)

---

### 4. Planner and SharedPlanner are twins who refuse to share a bedroom

Both define `PLANNER_SCROLL_LOCK`, both run the same `useEffect`, both render identical loading chrome, both build a `view(presence)` closure, both gate on `EMPTY_PRESENCE` then wrap `BoardPresenceBridge`.

Signed-in path: `PlannerProvider` context.  
Share path: hand-wire `usePlannerRuntime` in `SharedPlanner.jsx`.

Every chrome change is a dual edit. `BoardCanvas.jsx` is a 6-line rename wrapper over `WeekGrid` — architecture cosplay.

**Fix plan:** `02-unify-planner-shells.md`

---

### 5. The header is an icon landfill

Presence, account, guest upgrade, todos, share, theme, ⋯ (views + import/export + tutorial essay), print — one wrapping flex row. At 720px labels vanish; button count stays. The week grid — the actual product — starts under a toolbar demo.

Overlay grammar is a choose-your-own-adventure:
- **Sheet** for Editor / Print / Upgrade
- **TodoPanel** reimplements Dialog/Drawer instead of using Sheet
- **MenuPopover** for Share (full admin UI), board menu, account, views, more

Share is an admin console in a popover. Print is a ceremony stack (`PrintDialog` → `usePrintSetup` → `PrintMeta` → `print-prefs` → double `rAF` + `beforeprint` hacks) for `window.print()`.

**Fix plan:** `04-header-and-overlay-grammar.md`

---

### 6. God files that should be routes

| File | Lines | Crime |
|------|------:|-------|
| `Account.jsx` | 531 | Profile + swatches + theme + API tokens + upgrade |
| `Landing.jsx` | 463 | Fake grid + guest funnel + features + presence |
| `SharePanel.jsx` | 403 | Entire sharing product |
| `api/og.js` | 563 | OG PNG pipeline living in `api/` |
| `grid/drag.js` | 398 | Pointer state machine (this one's actually justified) |
| `server/rest-api.js` | 376 | Full REST switch |

Landing got the polish budget (stagger animations, floating preview, guest story). Product got Lucide soup. Hero brand is nav-sized; the slogan overpowers the product name. `BrandMark`'s `large` / `markLg` are dead code.

**Fix plan:** `05-split-god-files.md`

---

### 7. API layer is copy-paste serverless soup

`json` / `readBody` duplicated across `api/invite.js`, `api/tokens.js`, `rest-api.js`. CORS `*`. Comment in `rest-api.js` still describes multi-file catch-all routes; `vercel.json` already rewrites to a single `api/v1.js`. Half-migrated mental model left in the source.

Pure helpers in `rest.js` / `og-meta.js` / `api-tokens.js` are fine. The handlers around them are not.

**Fix plan:** `06-api-layer-cleanup.md`

---

### 8. Tests cover kernels; Instant orchestration is a prayer

~2.1k test lines. Drag, packing, share crypto, REST matching, OG meta, models, policies — good.

Untested where bugs live: `useWorkspace`, `useShareActions`, `useSharedBoard`, `useEventMutations`, `useEditorSession`, Account token flows, invite handler, SharePanel, Planner shells. `workspace-bootstrap.js` (a boolean factory) has a test. `workspace-ensure.js` (the thing that mutates DB and migrates localStorage) does not.

21 hooks. Almost none tested. Thin wrappers (`planner-context.js` = 3 lines, `useAppUpdate.js` = 6 lines) pretend to be layers.

**Fix plan:** `07-test-orchestration.md`

---

## What's actually good (so the roast isn't empty calories)

- Grid geometry / drag / packing are thoughtfully factored and tested
- Hold-to-confirm is a real interaction idea, not a confirm dialog cosplay
- Korean microcopy is often warm ("복사했어요") — then ruined by `오류: ${message}` dumps
- Command-result + transaction helpers are a sane pattern
- Presence cursors are a genuine product moment, not a checkbox feature
- Docs site exists and is structured — rare for a solo planner

The craft in the middle is real. The surface area around it is the problem.

---

## Priority order for fixes

| Priority | Plan | Why |
|----------|------|-----|
| P0 | `01` Sharing dual-truth | Highest ongoing bug + cognitive tax |
| P0 | `02` Unify planner shells | Stops dual-edit rot immediately |
| P1 | `04` Header + overlay grammar | Highest user-facing leverage |
| P1 | `08` Kill legacy duals | Stops museum maintenance |
| P2 | `05` Split god files | Enables parallel work |
| P2 | `03` StyleX primitives | Unlocks consistent UI without dump files |
| P2 | `06` API cleanup | Hygiene; lower user impact |
| P3 | `07` Orchestration tests | Protects the refactors above |

Do not start with a "redesign." Start by deleting dual systems and unifying shells. The UI will still look like an icon landfill after that — then do `04`.
