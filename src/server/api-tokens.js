/**
 * Personal access tokens for the REST API. Pure helpers shared by the
 * serverless functions and tests — only a hash of the token is ever stored;
 * the plaintext is shown once at creation/rotation.
 *
/**
 * Hash = SHA-256(pepper ? `${pepper}:${token}` : token).
 * New tokens should always pass `API_TOKEN_PEPPER` when configured.
 * Lookup still tries the unpeppered form so pre-pepper rows keep working
 * until the owner rotates them.
 */

export const API_TOKEN_PREFIX = 'wp_';
/** Random payload bytes → 48 hex chars after the prefix. */
const TOKEN_BYTES = 24;
/** Characters of the token kept for display (`wp_ab12cd34`). */
const DISPLAY_CHARS = API_TOKEN_PREFIX.length + 8;

const MAX_NAME = 40;

/** @param {Uint8Array} bytes */
function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** @returns {string} a fresh `wp_…` token (plaintext — hash before storing). */
export function generateApiToken() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return API_TOKEN_PREFIX + hex(bytes);
}

/** @param {string} token @returns {boolean} */
export function isApiTokenShape(token) {
  return (
    typeof token === 'string' &&
    new RegExp(`^${API_TOKEN_PREFIX}[0-9a-f]{${TOKEN_BYTES * 2}}$`).test(token)
  );
}

/** Display prefix stored alongside the hash so users can tell tokens apart. */
export function apiTokenPrefixOf(token) {
  return String(token || '').slice(0, DISPLAY_CHARS);
}

/**
 * @param {string} token
 * @param {string | null | undefined} [pepper]
 * @returns {Promise<string>} hex SHA-256
 */
export async function hashApiToken(token, pepper = '') {
  const material = pepper ? `${pepper}:${token}` : String(token);
  const data = new TextEncoder().encode(material);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return hex(new Uint8Array(digest));
}

/**
 * Candidate hashes to look up for a bearer token (peppered first when set,
 * then legacy unpeppered so existing rows keep working after pepper is added).
 * @param {string} token
 * @param {string | null | undefined} [pepper]
 * @returns {Promise<string[]>}
 */
export async function apiTokenLookupHashes(token, pepper = '') {
  const hashes = [];
  if (pepper) hashes.push(await hashApiToken(token, pepper));
  hashes.push(await hashApiToken(token, ''));
  return [...new Set(hashes)];
}

/** Normalize a user-supplied token label. */
export function apiTokenName(input) {
  return typeof input === 'string' ? input.trim().slice(0, MAX_NAME) : '';
}

/** `Authorization: Bearer wp_…` → token, or null when absent/malformed. */
export function parseBearer(headerValue) {
  const m = /^Bearer\s+(\S+)$/i.exec(String(headerValue || '').trim());
  return m && isApiTokenShape(m[1]) ? m[1] : null;
}
