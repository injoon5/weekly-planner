/** Canonical role / share-mode contracts. */

export const MEMBER_ROLE = /** @type {const} */ ({
  VIEWER: 'viewer',
  EDITOR: 'editor',
});

export const BOARD_ROLE = /** @type {const} */ ({
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
});

export const SHARE_MODE = /** @type {const} */ ({
  OPEN: 'open',
  PASSWORD: 'password',
});

export const SHARE_ROLE = /** @type {const} */ ({
  VIEWER: 'viewer',
  EDITOR: 'editor',
});

/** @typedef {'viewer' | 'editor'} MemberRole */
/** @typedef {'owner' | 'viewer' | 'editor'} BoardRole */
/** @typedef {'open' | 'password'} ShareMode */
/** @typedef {'viewer' | 'editor'} ShareRole */

/** @param {unknown} role @returns {MemberRole} */
export function normalizeMemberRole(role) {
  return role === MEMBER_ROLE.EDITOR ? MEMBER_ROLE.EDITOR : MEMBER_ROLE.VIEWER;
}

/** @param {unknown} role */
export function isEditorRole(role) {
  return normalizeMemberRole(role) === MEMBER_ROLE.EDITOR;
}

/** @param {unknown} mode @returns {ShareMode} */
export function normalizeShareMode(mode) {
  return mode === SHARE_MODE.PASSWORD ? SHARE_MODE.PASSWORD : SHARE_MODE.OPEN;
}

/** @param {unknown} role @returns {ShareRole} */
export function normalizeShareRole(role) {
  return role === SHARE_ROLE.EDITOR ? SHARE_ROLE.EDITOR : SHARE_ROLE.VIEWER;
}
