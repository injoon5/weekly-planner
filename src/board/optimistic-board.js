import { defaultBoardRange } from '../lib/time.js';

/** Client-only board id used while `ensureWorkspace` seeds the first board. */
export const OPTIMISTIC_BOARD_ID = 'local:boot';

export function isOptimisticBoardId(id) {
  return typeof id === 'string' && id.startsWith('local:');
}

/** Placeholder board so chrome + empty grid paint before Instant seed lands. */
export function makeOptimisticBoard(user) {
  const range = defaultBoardRange();
  return {
    id: OPTIMISTIC_BOARD_ID,
    name: '내 시간표',
    from: range.from,
    to: range.to,
    createdAt: 0,
    sortOrder: 0,
    owner: user?.id ? { id: user.id } : null,
    editors: [],
    members: [],
  };
}
