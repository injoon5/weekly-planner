# Collapse sharing dual-truth into one write authority

Written against: `00771d4c053a501914a53a668039f502d3751cc`

## Outcome

One source of truth for "can this user edit this board." Remove the members.role / boards.editors dual-write and the `roleKnown` hydrate tax. Keep share links (open/password) and invited members, but make role derivation boring.

## Evidence chain

- Surface: signed-in planner + SharePanel + SharedPlanner `/s/:token`
- Problem: `member-policy.js` documents `members.role` as display cache and `boards.editors` as write truth; `roleForBoard` / `roleKnown` / `shouldShowViewerBanner` exist to paper over hydrate races; three role enums in `roles.js`
- Owner: `src/sharing/*`, `instant.perms.ts`, `useShareActions.js`, `SharePanel.jsx`, `useWorkspace.js`
- Scope: sharing + Instant perms + any UI that reads `isOwner` / `canEdit` / viewer banner
- Uncertainty: Instant permission rules may require a link for efficient `allow` checks — validate whether `members.role === 'editor'` can replace `editors` link in perms without full table scans

## Design decision

**Pick members as the single role store.** Derive edit capability from `members.role` (owner via `boards.owner` link). Drop `boards.editors` link updates from all txs. Update Instant perms to check membership role (or a single `canEdit` bind) instead of `editors`. Delete `roleKnown` once queries always include the relations needed for a definitive role.

Alternative if Instant perms cannot efficiently check member role: keep `editors` link as the *only* write signal and stop storing/displaying a separate `members.role` — role UI reads the link. Do **not** keep both.

Also collapse `MEMBER_ROLE` / `SHARE_ROLE` / `BOARD_ROLE` into one role vocabulary (`owner | editor | viewer`) with thin adapters only where Instant strings differ.

## Reuse

- Keep: `createMemberTxs` / `removeMemberTxs` shape, but single-write
- Keep: `deriveShareAccessState` for link/password gate
- Exemplar for clean policy: `src/sharing/share-access.js` (already pure + tested)
- Delete after: unused `isEditor` bind in `instant.perms.ts` if still unreferenced

## Changes

1. `src/sharing/member-policy.js`
   - Change: txs only update/delete members; remove `link`/`unlink` editors (or inverse: only editors link, no role field — pick one)
   - Preserve: invite/remove member UX semantics
   - Verify: `policies.test.js` updated; no dual arrays in returned txs

2. `src/sharing/roles.js`
   - Change: one role map; deprecate duplicate enums
   - Preserve: string values already in DB (`viewer`/`editor`)

3. `instant.perms.ts`
   - Change: `events` / board write rules use single authority
   - Preserve: owner-only board meta updates; share `ruleParams` for public links
   - Verify: editor can mutate events; viewer cannot; owner can manage members

4. `src/hooks/useWorkspace.js` + `useShareActions.js`
   - Change: remove `roleKnown` gating if hydrate is definitive; simplify `showViewerBanner`
   - Preserve: optimistic board seed behavior

5. `src/components/SharePanel.jsx` + related UI
   - Change: role toggles call single-write API
   - Preserve: password/open modes, rotate/disable link, invite email flow

6. Data migration (if dropping `editors` link)
   - Change: one-shot ensure every `members.role === 'editor'` has whatever the new truth needs (or backfill members from editors)
   - Preserve: existing share links / secrets untouched

## Scope

- Inherit: SharedPlanner guest edit via share secret (separate from member roles — keep)
- Verify: REST `asUser` edit paths, invite admin txs
- Exclude: redesigning SharePanel layout (see plan `04`); killing password shares; OG/share-meta

## Validation

- Product: owner invites editor → editor can drag events; demote to viewer → drag fails; remove member → no access
- Interface: no viewer-banner flash for owner on cold load; SharePanel role toggle works once
- System: grep shows no `link({ editors` / `unlink({ editors` left (or no `members.role` writes — depending on chosen truth)
- Repository: `npm run check` → pass; extend `test/policies.test.js`

## Stop conditions

- Stop if Instant cannot express member-role checks without O(n) scans — then invert (editors-link-only) instead of inventing a third hybrid
- Stop if production data has editors without member rows — migrate first
