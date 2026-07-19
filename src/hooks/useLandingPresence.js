import { useEffect, useMemo } from 'react';
import { db } from '../db/instant.js';
import { normalizePeers, peerColor, sessionSeed, shortName } from '../presence/identity.js';

/** Fixed Instant room id for marketing-page presence (not a real board). */
export const LANDING_ROOM_ID = 'landing';

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

  const peers = useMemo(() => normalizePeers(rawPeers), [rawPeers]);

  return { peers, isReady: true };
}
