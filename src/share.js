/** Share-link crypto + URL + session unlock. */

export function randomToken(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
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
