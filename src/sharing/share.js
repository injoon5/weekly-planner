/** Share-link crypto + URL + session unlock. */

const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** PBKDF2 params for password-mode share secrets (Web Crypto). */
export const SHARE_PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;

/** @param {Uint8Array} bytes */
function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** @param {string} hexStr */
function fromHex(hexStr) {
  const clean = String(hexStr || '');
  if (!/^[0-9a-f]*$/i.test(clean) || clean.length % 2 !== 0) {
    throw new Error('Invalid salt hex');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Short base62 token (~48 bits at 8 chars). Older hex / 10-char tokens stay valid. */
export function randomToken(length = 8) {
  const out = [];
  // Rejection-sample so every character is uniform (256 % 62 ≠ 0).
  const limit = 256 - (256 % TOKEN_ALPHABET.length);
  while (out.length < length) {
    const arr = new Uint8Array(length - out.length);
    crypto.getRandomValues(arr);
    for (const b of arr) {
      if (b < limit && out.length < length) out.push(TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]);
    }
  }
  return out.join('');
}

/** Random salt for new password-mode shares (hex). */
export function randomShareSalt() {
  return hex(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

/**
 * Legacy share password hash: SHA-256(token:password).
 * Unlock-only — new password shares always mint a PBKDF2 salt.
 * Rows without `passwordSalt` keep working until the owner sets a new password.
 */
export async function hashSharePasswordLegacy(token, password) {
  const data = new TextEncoder().encode(`${token}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return hex(new Uint8Array(digest));
}

/**
 * PBKDF2-SHA-256 derived key for password-mode shares.
 * @param {string} password
 * @param {string} saltHex
 * @param {number} [iterations]
 */
export async function hashSharePasswordPbkdf2(
  password,
  saltHex,
  iterations = SHARE_PBKDF2_ITERATIONS,
) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromHex(saltHex),
      iterations,
    },
    keyMaterial,
    DERIVED_BITS,
  );
  return hex(new Uint8Array(bits));
}

/**
 * Hash a share password for storage / unlock.
 * When `salt` is set → PBKDF2; otherwise legacy SHA-256(token:password).
 * @param {string} token
 * @param {string} password
 * @param {string | null | undefined} [salt]
 */
export async function hashSharePassword(token, password, salt) {
  if (salt) return hashSharePasswordPbkdf2(password, salt);
  return hashSharePasswordLegacy(token, password);
}

export function sharePath(token) {
  return `/s/${token}`;
}

export function shareUrl(token) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${sharePath(token)}`;
}

function unlockKey(token) {
  return `weekly-planner.share.unlock.${token}`;
}

export function readShareUnlock(token) {
  try {
    return sessionStorage.getItem(unlockKey(token)) || '';
  } catch {
    return '';
  }
}

export function writeShareUnlock(token, secret) {
  try {
    sessionStorage.setItem(unlockKey(token), secret);
  } catch {
    /* ignore */
  }
}

export function clearShareUnlock(token) {
  try {
    sessionStorage.removeItem(unlockKey(token));
  } catch {
    /* ignore */
  }
}
