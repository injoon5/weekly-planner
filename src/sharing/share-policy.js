import {
  normalizeShareMode,
  normalizeShareRole,
  SHARE_MODE,
  SHARE_ROLE,
} from './roles.js';
import { hashSharePassword, randomShareSalt, randomToken } from './share.js';
import { t } from '../strings.js';

/**
 * The share row whose link is currently live, or null. The share panel keys
 * its "create vs manage" UI off this.
 * @param {{ shares?: Array<{ enabled?: boolean }> } | null | undefined} board
 */
export function enabledShareOf(board) {
  return (board?.shares || []).find((s) => s.enabled) || null;
}

/**
 * The share row write actions operate on: the enabled one, falling back to a
 * disabled row so re-enabling reuses its token and the old URL stays valid.
 * @param {{ shares?: Array<{ enabled?: boolean }> } | null | undefined} board
 */
export function activeShareOf(board) {
  return enabledShareOf(board) || board?.shares?.[0] || null;
}

/** Minimum length for share passwords. */
export const SHARE_PASSWORD_MIN = 4;

function assertSharePassword(password) {
  if (!password) throw new Error(t.share.err.enterPassword);
  if (String(password).length < SHARE_PASSWORD_MIN) {
    throw new Error(t.share.err.passwordTooShort(SHARE_PASSWORD_MIN));
  }
}

/**
 * Patch that turns a share off. The permission rules test `enabled` and
 * `secret` across ALL of a board's share rows independently
 * (`true in shares.enabled && ruleParams.secret in shares.secret`), so a
 * disabled row keeping its old secret could still unlock the board while any
 * other row is enabled. Scramble the secret and drop editSecret so a revoked
 * link can never match again; re-enabling mints fresh secrets anyway.
 */
export function buildShareDisable() {
  return {
    enabled: false,
    secret: `revoked:${randomToken(16)}`,
    editSecret: null,
  };
}

/**
 * Build open or password share payload. editSecret only when role=editor.
 * Password mode always mints a fresh salt + PBKDF2 secret.
 * @param {{
 *   mode?: unknown,
 *   role?: unknown,
 *   password?: string,
 *   existingToken?: string | null,
 * }} args
 */
export async function buildShareSecrets({
  mode,
  role,
  password = '',
  existingToken = null,
}) {
  const nextMode = normalizeShareMode(mode);
  const nextRole = normalizeShareRole(role);
  const token = existingToken || randomToken();
  let secret;
  /** @type {string | undefined} */
  let passwordSalt;
  if (nextMode === SHARE_MODE.PASSWORD) {
    assertSharePassword(password);
    passwordSalt = randomShareSalt();
    secret = await hashSharePassword(token, password, passwordSalt);
  } else {
    secret = token;
  }
  return {
    token,
    secret,
    mode: nextMode,
    role: nextRole,
    ...(passwordSalt ? { passwordSalt } : {}),
    // Instant: omit editSecret for viewers (don't write empty string).
    ...(nextRole === SHARE_ROLE.EDITOR ? { editSecret: secret } : {}),
  };
}

/**
 * Secrets + fields for updating an existing live share while keeping its token.
 * @param {{
 *   share: {
 *     token: string,
 *     mode?: unknown,
 *     role?: unknown,
 *     secret?: string,
 *     passwordSalt?: string,
 *   },
 *   mode?: unknown,
 *   role?: unknown,
 *   password?: string,
 * }} args
 */
export async function buildShareUpdate({ share, mode, role, password = '' }) {
  if (!share?.token) throw new Error(t.share.err.noLink);
  const nextMode = normalizeShareMode(mode ?? share.mode);
  const nextRole = normalizeShareRole(role ?? share.role);
  let secret;
  /** @type {string | undefined | null} */
  let passwordSalt;
  if (nextMode === SHARE_MODE.PASSWORD) {
    if (password) {
      assertSharePassword(password);
      passwordSalt = randomShareSalt();
      secret = await hashSharePassword(share.token, password, passwordSalt);
    } else if (normalizeShareMode(share.mode) === SHARE_MODE.PASSWORD) {
      secret = share.secret;
      passwordSalt = share.passwordSalt || null;
    }
    if (!secret) throw new Error(t.share.err.enterPassword);
  } else {
    secret = share.token;
    passwordSalt = null;
  }
  return {
    token: share.token,
    secret,
    mode: nextMode,
    role: nextRole,
    enabled: true,
    // Explicit null clears a leftover salt when switching to open mode.
    passwordSalt: passwordSalt ?? null,
    ...(nextRole === SHARE_ROLE.EDITOR ? { editSecret: secret } : {}),
  };
}
