import {
  normalizeShareMode,
  normalizeShareRole,
  SHARE_MODE,
  SHARE_ROLE,
} from './roles.js';
import { hashSharePassword, randomShareSalt, randomToken } from './share.js';

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
    if (!password) throw new Error('비밀번호를 입력하세요');
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
  if (!share?.token) throw new Error('공유 링크가 없어요');
  const nextMode = normalizeShareMode(mode ?? share.mode);
  const nextRole = normalizeShareRole(role ?? share.role);
  let secret;
  /** @type {string | undefined | null} */
  let passwordSalt;
  if (nextMode === SHARE_MODE.PASSWORD) {
    if (password) {
      passwordSalt = randomShareSalt();
      secret = await hashSharePassword(share.token, password, passwordSalt);
    } else if (normalizeShareMode(share.mode) === SHARE_MODE.PASSWORD) {
      secret = share.secret;
      passwordSalt = share.passwordSalt || null;
    }
    if (!secret) throw new Error('비밀번호를 입력하세요');
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
