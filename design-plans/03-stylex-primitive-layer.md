# StyleX: primitives over screen dumps

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

A small primitive/style layer (spacing, type, surfaces, control sizes, shared breakpoints) so feature StyleX modules shrink and stop re-pasting magic numbers and brand hex. Do **not** redesign the product look — extract what already repeats.

## Evidence chain

- Surface: entire SPA StyleX usage
- Problem: `styles/grid.js` 671 / `landing.js` 637 / `planner.js` 583 dwarf components; `tokens.stylex.js` is 66 lines; hard-coded `#E96D4F` / `#4E9EDB` duplicated; breakpoints re-pasted because `breakpoints.js` can't feed `stylex.create`
- Owner: `src/styles/*`, `src/styles/tokens.stylex.js`
- Scope: tokens + extraction into shared style modules; migrate hottest consumers
- Uncertainty: StyleX `defineVars` / media-query ergonomics — keep MQ strings as exported constants even if not injectable into create()

## Design decision

1. Expand `tokens.stylex.js` (or sibling `space.stylex.js` / `type.stylex.js`) with the spacing, radius, font-size, and control-height values already used repeatedly in `planner.js` / `ui.js` / `menus.js`.
2. Export breakpoint string constants from `breakpoints.js` and **require** feature files to import them (even if StyleX needs the literal in `create` — use a shared object of MQ strings and reference the same constants in comments + JS runtime matches like `MOBILE_SHEET_BP`).
3. Move brand accent hex into tokens; kill duplicates in landing/auth/ui.
4. Cap new styles: new UI goes into primitives or extends existing keys — no new 400-line screen files without extracting shared keys first.
5. Leave `palette.css` for event colors if StyleX can't own them cleanly; document that split in a one-line comment at the top of `palette.css`.

Do not rewrite grid geometry vars (`slotH`/`gutW`) in this plan — that's a grid refactor. Just stop growing dump files.

## Reuse

- Existing: `tokens.stylex.js`, `styles/ui.js`, `styles/menus.js`
- Exemplar consumers after: `PlannerHeader`, buttons in `ui.js`, landing CTA colors

## Changes

1. `src/styles/tokens.stylex.js` (+ optional split files)
   - Change: add space/type/radius/accent vars actually used today
   - Preserve: existing color roles and layout slot vars

2. `src/styles/breakpoints.js`
   - Change: single source for `720` / `560` / `760` / `460` strings + numeric BPs used in JS
   - Preserve: current breakpoint values (don't retune layout in this plan)
   - Verify: `Sheet.jsx` / `TodoPanel` / landing MQs import the same constants

3. `src/styles/ui.js`, `planner.js`, `landing.js`, `auth.js`
   - Change: replace duplicated hex and repeated padding/radius with tokens
   - Preserve: visual appearance (pixel-equivalent)
   - Verify: visual spot-check landing + planner header + menus

4. Stop-gap rule in `docs` or short comment in `styles/README` (only if docs already discuss styles)
   - Change: "feature modules compose primitives; don't paste MQ/hex"

## Scope

- Inherit: all StyleX consumers gradually
- Verify: print styles, dark theme (`theme/themes.js`) still resolve
- Exclude: visual redesign, landing content rewrite, deleting `base-ui.css` motion (needed for Base UI)

## Validation

- Product: no intentional visual change
- Interface: landing, planner, account, share popover, mobile 375w + desktop 1280w
- System: grep for `#E96D4F` / `#4E9EDB` → only token definitions (or palette if intentional)
- Repository: `npm run check` → pass

## Stop conditions

- Stop if a "primitive extraction" starts changing visual design — revert to token-only swaps
- Stop if StyleX var explosion hurts bundle — prefer fewer vars reused over 1:1 extraction of every one-off
