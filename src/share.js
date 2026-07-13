/** Share-link crypto + URL + session unlock. */

const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Short base62 token (~59 bits at 10 chars). Older 32-char hex tokens stay valid. */
export function randomToken(length = 10) {
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

export async function hashSharePassword(token, password) {
  const data = new TextEncoder().encode(`${token}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function shareUrl(token) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/s/${token}`;
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
