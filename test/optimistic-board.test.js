import { describe, expect, it } from 'vitest';
import {
  isOptimisticBoardId,
  makeOptimisticBoard,
  OPTIMISTIC_BOARD_ID,
} from '../src/board/optimistic-board.js';

describe('optimistic board seed', () => {
  it('tags placeholder ids so presence/mutations can skip them', () => {
    expect(isOptimisticBoardId(OPTIMISTIC_BOARD_ID)).toBe(true);
    expect(isOptimisticBoardId('real-id')).toBe(false);
    expect(isOptimisticBoardId(null)).toBe(false);
  });

  it('builds a read-friendly placeholder owned by the seeding user', () => {
    const board = makeOptimisticBoard({ id: 'u1' });
    expect(board.id).toBe(OPTIMISTIC_BOARD_ID);
    expect(board.name).toBe('내 시간표');
    expect(board.owner).toEqual({ id: 'u1' });
    expect(board.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(board.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
