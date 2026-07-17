import { db, id } from '../instant.js';
import { serializeColorLabels } from '../../board/prefs.js';
import { defaultBoardRange } from '../../lib/time.js';
import { createEventTx } from './events.js';

export function boardTx(userId, board, sortOrder) {
  const bid = id();
  const range = defaultBoardRange();
  const from = board.from || range.from;
  const to = board.to || range.to;
  const txs = [
    db.tx.boards[bid]
      .update({
        name: board.name || '시간표',
        from,
        to,
        createdAt: Date.now(),
        sortOrder,
        colorLabels: board.colorLabels || '',
        // Written only when set so boards stay creatable before the schema
        // gains the attr (`npm run push:schema`).
        ...(board.repeatEvery ? { repeatEvery: board.repeatEvery } : {}),
      })
      .link({ owner: userId }),
  ];
  for (const e of board.events || []) {
    txs.push(createEventTx(bid, e).tx);
  }
  return { bid, txs };
}

export function patchBoardTx(bid, patch) {
  const clean = {};
  for (const k of ['name', 'from', 'to', 'repeatEvery', 'sortOrder', 'colorLabels']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (clean.colorLabels !== undefined && typeof clean.colorLabels === 'object') {
    clean.colorLabels = serializeColorLabels(clean.colorLabels);
  }
  if (!Object.keys(clean).length) return null;
  return db.tx.boards[bid].update(clean);
}

export function deleteBoardTx(boardId) {
  return db.tx.boards[boardId].delete();
}

export function deleteEventRowsTx(eventIds) {
  return (eventIds || []).map((eid) => db.tx.events[eid].delete());
}
