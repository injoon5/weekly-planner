import { useEffect, useMemo } from 'react';
import { db } from '../db/instant.js';
import {
  PEER_COLORS,
  normalizePeers,
  peerColor,
  sessionSeed,
  shortName,
} from '../presence/identity.js';
import { t } from '../strings.js';

/**
 * Instant room presence for a board (presence-and-topics).
 * https://www.instantdb.com/docs/presence-and-topics
 *
 * Call only with a real board id (see BoardPresenceBridge). Do not pass null /
 * optimistic ids — that used to open per-tab `idle:` rooms during cold boot.
 */
export function useBoardPresence({ boardId, user, role, guestLabel, settings }) {
  const room = db.room('board', boardId);

  const customName = settings?.displayName?.trim();
  const name = customName || (user?.email ? shortName(user.email) : guestLabel || t.app.guest);
  const color = PEER_COLORS.includes(settings?.presenceColor)
    ? settings.presenceColor
    : peerColor(user?.email || sessionSeed());

  const { user: myPresence, peers: rawPeers, publishPresence } = db.rooms.usePresence(room, {
    initialPresence: {
      name,
      color,
      role: role || 'viewer',
    },
  });

  useEffect(() => {
    if (!publishPresence) return;
    publishPresence({
      name,
      color,
      role: role || 'viewer',
    });
  }, [name, color, role, publishPresence]);

  const peers = useMemo(() => normalizePeers(rawPeers), [rawPeers]);

  return {
    room,
    peers,
    myColor: color,
    myName: name,
    isReady: Boolean(myPresence),
  };
}
