# Split god files into route-sized modules

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

Account, Landing, and SharePanel stop being single-file apps. Each concern gets a module with a clear export surface so UI and data wiring can change independently.

## Evidence chain

- Surface: `/account`, `/` landing, Share UI
- Problem: `Account.jsx` 531 (profile/theme/tokens/upgrade), `Landing.jsx` 463 (marketing/guest/presence/fake grid), `SharePanel.jsx` 403 (all sharing admin)
- Owner: those components + their style modules
- Scope: file splits + import updates; behavior-preserving
- Uncertainty: none

## Design decision

Split by **user task**, not by arbitrary line count:

**Account**
- `AccountProfile.jsx` — name, avatar color
- `AccountTheme.jsx` — theme card
- `AccountTokens.jsx` — API token CRUD (+ `tokensRequest` helper → `src/lib/` or `src/server/` client helper)
- `Account.jsx` — page shell composing the above + logout/upgrade entry

**Landing**
- `LandingHero.jsx` — brand, CTA, preview
- `LandingFeatures.jsx` — feature/steps sections
- `useLocalTheme` / guest create — hooks beside or under `hooks/`
- `Landing.jsx` — composition only

**SharePanel**
- `ShareLinkSettings.jsx` — open/password, rotate, disable
- `ShareMembers.jsx` — list + role + invite
- `SharePanel.jsx` — composes sections (works with plan `04` Sheet host)

Do not split `grid/drag.js` — size is justified by a real state machine.

`api/og.js` (563): move pure rendering helpers next to `src/server/og-meta.js`; keep Vercel entry thin (plan `06` overlap — do OG thin-entry there).

## Reuse

- Existing subcomponents already inside Account (`ColorSwatches`, cards) — promote to files
- Style modules can stay screen-named initially; split styles only when a section is reused

## Changes

1. Split files as above; re-export from old paths only if something external imports them (prefer updating imports)
2. Keep Korean copy and StyleX class names stable
3. Delete dead Landing `BrandMark` `large`/`markLg` if unused after split

## Scope

- Inherit: router lazy imports if any
- Verify: account token create/revoke, landing guest sign-in, share invite
- Exclude: visual redesign; permission model changes

## Validation

- Product: account + landing + share flows unchanged
- Repository: `npm run check` → pass; no circular imports

## Stop conditions

- Stop if split introduces prop-drilling worse than the god file — use thin local context per page instead
