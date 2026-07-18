/** Canonical role / share-mode contracts. */

/** Viewer | editor access (members + share links). */
export const ACCESS_ROLE = /** @type {const} */ ({
  VIEWER: 'viewer',
  EDITOR: 'editor',
});

/** @deprecated Prefer ACCESS_ROLE — alias kept for call sites. */
export const MEMBER_ROLE = ACCESS_ROLE;

/** @deprecated Prefer ACCESS_ROLE — alias kept for call sites. */
export const SHARE_ROLE = ACCESS_ROLE;

export const BOARD_ROLE = /** @type {const} */ ({
  OWNER: 'owner',
  EDITOR: ACCESS_ROLE.EDITOR,
  VIEWER: ACCESS_ROLE.VIEWER,
});

export const SHARE_MODE = /** @type {const} */ ({
  OPEN: 'open',
  PASSWORD: 'password',
});

/** @typedef {'viewer' | 'editor'} MemberRole */
/** @typedef {'owner' | 'viewer' | 'editor'} BoardRole */
/** @typedef {'open' | 'password'} ShareMode */
/** @typedef {'viewer' | 'editor'} ShareRole */

/** @param {unknown} role @returns {MemberRole} */
export function normalizeMemberRole(role) {
  return role === ACCESS_ROLE.EDITOR ? ACCESS_ROLE.EDITOR : ACCESS_ROLE.VIEWER;
}

/** @param {unknown} role */
export function isEditorRole(role) {
  return normalizeMemberRole(role) === ACCESS_ROLE.EDITOR;
}

/** @param {unknown} mode @returns {ShareMode} */
export function normalizeShareMode(mode) {
  return mode === SHARE_MODE.PASSWORD ? SHARE_MODE.PASSWORD : SHARE_MODE.OPEN;
}

/** @param {unknown} role @returns {ShareRole} */
export function normalizeShareRole(role) {
  return role === ACCESS_ROLE.EDITOR ? ACCESS_ROLE.EDITOR : ACCESS_ROLE.VIEWER;
}
