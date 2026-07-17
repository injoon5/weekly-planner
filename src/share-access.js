import { normalizeShareMode, normalizeShareRole, SHARE_MODE } from './roles.js';

/**
 * Secret used for open-link shares before/without metadata.
 * Password shares withhold the secret until unlock.
 * @param {string | null | undefined} token
 * @param {{ mode?: unknown } | null | undefined} share
 */
export function openShareSecret(token, share) {
  if (!token) return '';
  if (!share || normalizeShareMode(share.mode) === SHARE_MODE.OPEN) return token;
  return '';
}

/**
 * Resolve the active secret for a guest share query.
 * @param {{
 *   token?: string | null,
 *   share?: { mode?: unknown } | null,
 *   manualSecret?: string | null,
 * }} args
 */
export function resolveShareSecret({ token, share, manualSecret }) {
  const open = openShareSecret(token, share);
  return manualSecret || open || '';
}

/**
 * Pure guest-access derivation for public share routes.
 * @param {{
 *   token?: string | null,
 *   share?: { mode?: unknown, role?: unknown, enabled?: boolean } | null,
 *   board?: unknown,
 *   metaLoading?: boolean,
 *   boardLoading?: boolean,
 *   manualSecret?: string | null,
 *   unlockError?: string | null,
 *   queryError?: unknown,
 * }} args
 */
export function deriveShareAccessState({
  token,
  share,
  board,
  metaLoading = false,
  boardLoading = false,
  manualSecret = '',
  unlockError = '',
  queryError = null,
}) {
  if (!token) {
    return {
      state: 'notFound',
      secret: '',
      role: 'viewer',
      canEdit: false,
      needsPassword: false,
      waitingUnlock: false,
      passwordFailed: false,
      isLoading: false,
      notFound: true,
      disabled: false,
      unlockError: '',
      error: queryError || null,
    };
  }

  const needsPassword = share ? normalizeShareMode(share.mode) === SHARE_MODE.PASSWORD : false;
  const waitingUnlock = Boolean(needsPassword) && !manualSecret;
  const secret = resolveShareSecret({ token, share, manualSecret });
  const role = normalizeShareRole(share?.role);
  const canEdit = Boolean(board) && role === 'editor';
  const disabled = Boolean(share && share.enabled === false);

  const boardPending = Boolean(secret) && !waitingUnlock;
  const isLoading =
    Boolean(token) && (metaLoading || (boardPending && boardLoading && !board));

  const passwordFailed =
    Boolean(needsPassword) &&
    Boolean(manualSecret) &&
    !boardLoading &&
    !board &&
    Boolean(share?.enabled);

  const boardMissing =
    boardPending &&
    !boardLoading &&
    !board &&
    Boolean(share?.enabled) &&
    !waitingUnlock;

  const notFound =
    Boolean(token) &&
    !waitingUnlock &&
    ((!metaLoading && (!share || share.enabled === false) && !board) || boardMissing);

  /** @type {'loading' | 'passwordRequired' | 'unlockFailed' | 'disabled' | 'notFound' | 'ready' | 'pendingBoard'} */
  let state = 'loading';
  if (queryError) state = 'loading';
  else if (disabled) state = 'disabled';
  else if (waitingUnlock) state = 'passwordRequired';
  else if (passwordFailed) state = 'unlockFailed';
  else if (notFound) state = 'notFound';
  else if (board) state = 'ready';
  else if (isLoading || boardPending) state = board && !boardLoading ? 'ready' : 'pendingBoard';
  else state = 'pendingBoard';

  return {
    state,
    secret,
    role,
    canEdit,
    needsPassword: waitingUnlock,
    waitingUnlock,
    passwordFailed,
    isLoading,
    notFound,
    disabled,
    unlockError: unlockError || (passwordFailed ? '비밀번호가 맞지 않아요' : ''),
    error: queryError || null,
  };
}

/** @deprecated Prefer deriveShareAccessState; kept for test naming clarity. */
export function sharedNotFound(args) {
  return deriveShareAccessState(args).notFound;
}
