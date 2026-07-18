# API / serverless handler cleanup

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

One shared HTTP helper for JSON/body/CORS. Thin `api/*` entrypoints. Comments match `vercel.json`. No behavior change to REST/auth contracts.

## Evidence chain

- Surface: `api/invite.js`, `api/tokens.js`, `api/v1.js`, `api/og.js`, `api/share-meta.js`, `src/server/rest-api.js`
- Problem: duplicated `json`/`readBody`; stale multi-file route comment in `rest-api.js`; fat OG handler in `api/`
- Owner: `api/*`, `src/server/*`, `vercel.json`
- Uncertainty: none

## Design decision

1. Add `src/server/http.js` with `sendJson`, `readBody`, shared CORS headers used by invite/tokens/REST.
2. Rewrite each `api/*.js` to import handlers from `src/server/*` and export default.
3. Fix `rest-api.js` header comment to describe the single rewrite in `vercel.json`.
4. Move OG rendering implementation under `src/server/`; `api/og.js` becomes a re-export like `api/v1.js`.
5. Leave CORS `*` unless you intentionally tighten — document why (browser PAT tools / curl).

## Reuse

- Exemplar: `api/v1.js` already thin-re-exports `rest-api.js`
- Pure logic already in `rest.js`, `og-meta.js`, `api-tokens.js`

## Changes

1. `src/server/http.js` (new) — shared helpers
2. `api/invite.js`, `api/tokens.js`, `src/server/rest-api.js` — use helpers; delete local copies
3. `api/og.js` — thin entry; implementation in `src/server/og-image.js` (or similar)
4. Comment + docs sync for REST routing

## Scope

- Exclude: new REST endpoints; auth model; rate limit redesign (legacy duals in plan `08`)

## Validation

- Product: invite, token CRUD, REST CRUD smoke via existing `test/rest.test.js` + `og-*.test.js`
- Repository: `npm run check` → pass

## Stop conditions

- Stop if moving OG breaks `@vercel/og` / font file URL resolution — keep fonts next to the entry that Vercel bundles, adjust imports carefully
