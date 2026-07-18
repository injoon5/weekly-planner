# Kill legacy duals (crypto, tokens, theme, JSON-in-strings)

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

One hash scheme for share passwords, one for API tokens, one theme persistence path for signed-in users, and structured fields instead of JSON-in-string where Instant allows. Legacy readers may remain for one migrate window, then delete.

## Evidence chain

- Surface: share unlock, API bearer auth, theme toggle, color label prefs
- Problem: PBKDF2 + legacy SHA-256 in `share.js`; peppered + unpeppered token hashes in `api-tokens.js`; Instant theme + `localStorage`; `colorLabels` / `hiddenColors` as serialized strings
- Owner: `src/sharing/share.js`, `src/server/api-tokens.js`, `src/hooks/useTheme.js`, `src/board/prefs.js`, schema
- Uncertainty: whether Instant schema can use JSON native types for labels — check Instant attrs; if not, keep strings but single serializer

## Design decision

**Crypto**
- Verify path: try primary (PBKDF2 / peppered) only after a forced re-hash on successful legacy login/unlock — or hard-cut if user volume is tiny (personal app: hard-cut is fine)
- Remove legacy SHA-256 and unpeppered hash branches once migrate done
- Rotate share links / tokens on cutover if you can't re-hash without plaintext

**Theme**
- Signed-in: Instant `settings.theme` only; read localStorage only as one-shot migrate in `workspace-ensure`
- Guests/landing: localStorage OK — document as intentional exception

**Prefs strings**
- Keep serializers in `prefs.js` as the only encode/decode gate; stop ad-hoc `JSON.parse` elsewhere
- If schema can take real JSON attrs, migrate `colorLabels` / `hiddenColors` and delete serializers

**Rate limits**
- Keep dual Instant + in-memory REST limiter only if documented as defense-in-depth; otherwise drop comment lies. Not a hard delete target.

**legacy.js**
- Keep while import + ensure still need `normBoards`; rename to `migrate-local.js` so it doesn't sound optional forever — or delete once ensure drops localStorage import path

## Reuse

- `share-crypto` tests already encode both paths — rewrite to primary-only after cut
- `prefs.js` parsers — single chokepoint

## Changes

1. `src/sharing/share.js` + tests — primary verify; migrate-on-success or hard-cut
2. `src/server/api-tokens.js` + tokens API — pepper required in prod; reject legacy hashes after migrate
3. `useTheme.js` / landing local theme — signed-in path Instant-only post-migrate
4. `prefs.js` + schema — optional structured fields
5. Grep-delete dead legacy functions

## Scope

- Coordinate with plan `01` (roles dual) — separate PR ideally
- Exclude: REST feature work; UI redesign

## Validation

- Product: existing password share still unlocks after migrate strategy; new shares PBKDF2-only; API tokens work with pepper set
- Repository: `npm run check`; update `test/share-crypto.test.js`, token tests if any
- Env: `API_TOKEN_PEPPER` set in Vercel — fail closed in production if missing after cut

## Stop conditions

- Stop hard-cut if you cannot inventory active legacy password shares — use migrate-on-success first
- Stop if removing localStorage theme breaks first paint flash — keep FOUC prevention script in `index.html` reading the same key only as cache of Instant value
