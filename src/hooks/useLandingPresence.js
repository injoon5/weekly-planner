import { useEffect, useMemo } from 'react';
import { db } from '../db/instant.js';
import { peerColor, PEER_COLORS } from './useBoardPresence.js';

/** Fixed Instant room id for marketing-page presence (not a real board). */
export const LANDING_ROOM_ID = 'landing';

const SEED_KEY = 'weekly-planner.presence.seed';

/** Stable per-tab seed so signed-out visitors get distinct colors. */
function sessionSeed() {
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

function shortName(emailOrName) {
  if (!emailOrName) return '손님';
  const s = String(emailOrName);
  if (s.includes('@')) return s.split('@')[0];
  return s.slice(0, 16);
}

/**
 * Live presence on the landing page for signed-in and signed-out visitors.
 * Signed-out peers publish as anonymous "손님" with a per-tab color seed —
 * they show up in the avatar stack like everyone else.
 */
export function useLandingPresence() {
  const auth = db.useAuth();
  const user = auth.user;
  const room = db.room('board', LANDING_ROOM_ID);

  const seed = user?.email || user?.id || sessionSeed();
  const name = user?.email ? shortName(user.email) : '손님';
  const color = peerColor(seed);

  const { peers: rawPeers, publishPresence } = db.rooms.usePresence(room, {
    initialPresence: {
      name,
      color,
      role: 'viewer',
    },
  });

  useEffect(() => {
    if (!publishPresence) return;
    publishPresence({ name, color, role: 'viewer' });
  }, [name, color, publishPresence]);

  const peers = useMemo(() => {
    return Object.entries(rawPeers || {}).map(([id, peer]) => ({
      id,
      name: peer.name || shortName(peer.email),
      color:
        (PEER_COLORS.includes(peer.color) && peer.color) ||
        peer.color ||
        peerColor(id),
      role: peer.role || 'viewer',
    }));
  }, [rawPeers]);

  return { peers, isReady: true };
}
