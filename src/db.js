import { init, id } from '@instantdb/react';
import { APP_ID, THEME_KEY } from './config.js';
import { readLegacyBoards, seedEvents } from './legacy.js';
import { eventFields } from './models.js';
import schema from './schema.js';

export const db = init({ appId: APP_ID, schema });

export function boardTx(userId, board, sortOrder) {
  const bid = id();
  const txs = [
    db.tx.boards[bid]
      .update({
        name: board.name || '시간표',
        from: board.from || '',
        to: board.to || '',
        createdAt: Date.now(),
        sortOrder,
      })
      .link({ owner: userId }),
  ];
  for (const e of board.events || []) {
    const f = eventFields(e);
    txs.push(
      db.tx.events[id()]
        .update({
          day: f.day,
          title: f.title,
          start: f.start,
          dur: f.dur,
          color: f.color,
          memo: f.memo,
          createdAt: Date.now(),
        })
        .link({ board: bid }),
    );
  }
  return { bid, txs };
}

export function createEventTx(boardId, fields) {
  const eid = id();
  const f = eventFields(fields);
  return {
    eid,
    tx: db.tx.events[eid]
      .update({
        day: f.day,
        title: f.title,
        start: f.start,
        dur: f.dur,
        color: f.color,
        memo: f.memo,
        createdAt: Date.now(),
      })
      .link({ board: boardId }),
  };
}

export function patchEventTx(eid, patch) {
  const clean = {};
  for (const k of ['day', 'title', 'start', 'dur', 'color', 'memo']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (!Object.keys(clean).length) return null;
  return db.tx.events[eid].update(clean);
}

export function saveEventTx(eid, fields) {
  const f = eventFields(fields);
  return db.tx.events[eid].update({
    day: f.day,
    title: f.title,
    start: f.start,
    dur: f.dur,
    color: f.color,
    memo: f.memo,
  });
}

export function patchBoardTx(bid, patch) {
  const clean = {};
  for (const k of ['name', 'from', 'to', 'sortOrder']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (!Object.keys(clean).length) return null;
  return db.tx.boards[bid].update(clean);
}

const bootstrappedUsers = new Set();
const inflight = new Map();

/**
 * One-shot workspace setup per user session (module-level Set/Map dedupe):
 * migrate legacy localStorage boards, or seed a demo board; create settings once.
 * Safe across React Strict Mode double-invoke via inflight Map.
 */
export async function ensureWorkspace(user, { boardCount, hasSettings }) {
  if (!user?.id || bootstrappedUsers.has(user.id)) {
    return { seeded: false, firstId: null, migrated: false };
  }
  if (inflight.has(user.id)) return inflight.get(user.id);

  const run = (async () => {
    if (boardCount > 0 && hasSettings) {
      bootstrappedUsers.add(user.id);
      return { seeded: false, firstId: null, migrated: false };
    }

    const txs = [];
    let firstId = null;
    let migrated = false;

    if (boardCount === 0) {
      const legacy = readLegacyBoards();
      const source = legacy?.length
        ? legacy
        : [{ name: '내 시간표', from: '', to: '', events: seedEvents() }];
      migrated = Boolean(legacy?.length);
      source.forEach((b, i) => {
        const { bid, txs: bt } = boardTx(user.id, b, i);
        if (!firstId) firstId = bid;
        txs.push(...bt);
      });
    }

    if (!hasSettings) {
      const themeVal = localStorage.getItem(THEME_KEY) || 'light';
      txs.push(db.tx.settings[id()].update({ theme: themeVal }).link({ owner: user.id }));
    }

    if (txs.length) await db.transact(txs);
    bootstrappedUsers.add(user.id);
    return { seeded: boardCount === 0, firstId, migrated };
  })();

  inflight.set(user.id, run);
  try {
    return await run;
  } finally {
    inflight.delete(user.id);
  }
}

export function persistThemeTx(settings, theme) {
  if (!settings?.id) return null;
  return db.tx.settings[settings.id].update({ theme });
}

export { id };
