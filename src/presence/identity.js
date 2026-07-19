/**
 * Presence identity shared by the board room, the landing room, and the
 * account page: the avatar palette, deterministic color hashing, display-name
 * shortening, and the raw-peers → UI-peers mapping.
 *
 * Privacy: presence is broadcast to everyone in a room, including anonymous
 * share-link guests — publish the short display name only, never a raw email.
 */

export const PEER_COLORS = [
  '#E96D4F',
  '#E6A23C',
  '#53AE6E',
  '#3FA99B',
  '#4E9EDB',
  '#8578DE',
  '#E063A8',
  '#8F8F9C',
];

/** Deterministic avatar color from any string seed (email, id, tab seed). */
export function peerColor(seed = '') {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PEER_COLORS[h % PEER_COLORS.length];
}

/** Public display name: email local-part, or the name capped at 16 chars. */
export function shortName(emailOrName) {
  if (!emailOrName) return '손님';
  const s = String(emailOrName);
  if (s.includes('@')) return s.split('@')[0];
  return s.slice(0, 16);
}

const SEED_KEY = 'weekly-planner.presence.seed';

/** Stable per-tab seed so anonymous visitors get distinct colors. */
export function sessionSeed() {
  try {
    let s = sessionStorage.getItem(SEED_KEY);
    if (!s) {
      s = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(SEED_KEY, s);
    }
    return s;
  } catch {
    return String(Date.now() % 1e9);
  }
}

/**
 * Instant raw peers map → UI peer list. `shortName(peer.email)` keeps names
 * readable for peers on older clients that still publish the email field.
 * @param {Record<string, { name?: string, email?: string, color?: string, role?: string }> | null | undefined} rawPeers
 */
export function normalizePeers(rawPeers) {
  return Object.entries(rawPeers || {}).map(([id, peer]) => ({
    id,
    name: peer.name || shortName(peer.email),
    color: peer.color || peerColor(id),
    role: peer.role || 'viewer',
  }));
}
