import { useEffect, useMemo } from 'react';
import { db } from '../db.js';

const PEER_COLORS = [
  '#E96D4F',
  '#E6A23C',
  '#53AE6E',
  '#3FA99B',
  '#4E9EDB',
  '#8578DE',
  '#E063A8',
  '#8F8F9C',
];

export function peerColor(seed = '') {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PEER_COLORS[h % PEER_COLORS.length];
}

function shortName(emailOrName) {
  if (!emailOrName) return '손님';
  const s = String(emailOrName);
  if (s.includes('@')) return s.split('@')[0];
  return s.slice(0, 16);
}

/**
 * Instant room presence for a board (presence-and-topics).
 * https://www.instantdb.com/docs/presence-and-topics
 */
export function useBoardPresence({ boardId, user, role, guestLabel }) {
  const active = Boolean(boardId);
  const room = db.room('board', boardId || '__idle__');

  const name = user?.email ? shortName(user.email) : guestLabel || '손님';
  const email = user?.email || '';
  const color = peerColor(email || guestLabel || boardId || 'guest');

  const { user: myPresence, peers: rawPeers, publishPresence } = db.rooms.usePresence(
    room,
    active
      ? {
          initialPresence: {
            name,
            email,
            color,
            role: role || 'viewer',
          },
        }
      : undefined,
  );

  useEffect(() => {
    if (!active || !publishPresence) return;
    publishPresence({
      name,
      email,
      color,
      role: role || 'viewer',
    });
  }, [active, name, email, color, role, publishPresence]);

  const peers = useMemo(() => {
    if (!active) return [];
    return Object.entries(rawPeers || {}).map(([id, peer]) => ({
      id,
      name: peer.name || shortName(peer.email) || '동료',
      email: peer.email || '',
      color: peer.color || peerColor(id),
      role: peer.role || 'viewer',
    }));
  }, [active, rawPeers]);

  return {
    room: active ? room : null,
    peers,
    myColor: color,
    myName: name,
    isReady: Boolean(myPresence) && active,
  };
}
