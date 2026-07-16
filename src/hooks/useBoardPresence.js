import { useEffect, useMemo } from 'react';
import { db } from '../instant.js';

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

const SEED_KEY = 'weekly-planner.presence.seed';

/** Stable per-tab seed so anonymous guests get distinct colors (and their own idle room). */
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

/**
 * Instant room presence for a board (presence-and-topics).
 * https://www.instantdb.com/docs/presence-and-topics
 *
 * Privacy: presence is broadcast to everyone in the room, including
 * anonymous share-link guests — publish the short display name only,
 * never the raw email.
 */
export function useBoardPresence({ boardId, user, role, guestLabel }) {
  const active = Boolean(boardId);
  // Hooks must run unconditionally; park boardless sessions in a per-tab
  // room instead of one global "__idle__" room shared by every client.
  const room = db.room('board', boardId || 'idle:' + sessionSeed());

  const name = user?.email ? shortName(user.email) : guestLabel || '손님';
  const color = peerColor(user?.email || sessionSeed());

  const { user: myPresence, peers: rawPeers, publishPresence } = db.rooms.usePresence(
    room,
    active
      ? {
          initialPresence: {
            name,
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
      color,
      role: role || 'viewer',
    });
  }, [active, name, color, role, publishPresence]);

  const peers = useMemo(() => {
    if (!active) return [];
    return Object.entries(rawPeers || {}).map(([id, peer]) => ({
      id,
      // shortName(peer.email) keeps names readable for peers on older
      // clients that still publish the email field.
      name: peer.name || shortName(peer.email),
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
