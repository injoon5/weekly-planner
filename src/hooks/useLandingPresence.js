import { useEffect, useMemo } from 'react';
import { db } from '../db/instant.js';
import { peerColor, PEER_COLORS } from './useBoardPresence.js';

/** Fixed Instant room id for marketing-page presence (not a real board). */
export const LANDING_ROOM_ID = 'landing';

function shortName(emailOrName) {
  if (!emailOrName) return '손님';
  const s = String(emailOrName);
  if (s.includes('@')) return s.split('@')[0];
  return s.slice(0, 16);
}

/**
 * Live presence on the landing page.
 * Publishes only when signed in (email or guest); signed-out visitors see
 * peers who are already in the room and never invent fake avatars.
 */
export function useLandingPresence() {
  const auth = db.useAuth();
  const user = auth.user;
  const active = Boolean(user);
  const room = db.room('board', LANDING_ROOM_ID);

  const name = user?.email ? shortName(user.email) : '손님';
  const color = peerColor(user?.email || user?.id || 'landing');

  const { peers: rawPeers, publishPresence } = db.rooms.usePresence(
    room,
    active
      ? {
          initialPresence: {
            name,
            color,
            role: 'viewer',
          },
        }
      : undefined,
  );

  useEffect(() => {
    if (!active || !publishPresence) return;
    publishPresence({ name, color, role: 'viewer' });
  }, [active, name, color, publishPresence]);

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

  return { peers, isReady: active };
}
