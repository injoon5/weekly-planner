import { db, id } from '../instant.js';

export function upsertBoardPrefsTx(prefsId, userId, boardId, patch) {
  const clean = {};
  for (const k of ['hiddenColors', 'hideWeekend', 'compact', 'showMemos']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (prefsId) {
    return db.tx.boardPrefs[prefsId].update(clean);
  }
  const pid = id();
  return db.tx.boardPrefs[pid].update(clean).link({ user: userId, board: boardId });
}
