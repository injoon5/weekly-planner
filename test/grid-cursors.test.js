import { describe, expect, it } from 'vitest';
import { contentPointFromPane, gridCursorSpaceId } from '../src/grid/grid-cursors.js';

describe('contentPointFromPane', () => {
  it('maps viewport coordinates into scroll content space', () => {
    const pane = {
      scrollLeft: 40,
      scrollTop: 120,
      getBoundingClientRect: () => ({
        left: 100,
        top: 200,
        right: 500,
        bottom: 700,
        width: 400,
        height: 500,
      }),
    };

    expect(contentPointFromPane(pane, 180, 260)).toEqual({ x: 120, y: 180 });
  });

  it('updates content y when scrollTop changes at the same viewport point', () => {
    const pane = {
      scrollLeft: 0,
      scrollTop: 0,
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: 400,
        bottom: 500,
        width: 400,
        height: 500,
      }),
    };

    const before = contentPointFromPane(pane, 120, 240);
    pane.scrollTop = 80;
    const after = contentPointFromPane(pane, 120, 240);

    expect(before).toEqual({ x: 120, y: 240 });
    expect(after).toEqual({ x: 120, y: 320 });
  });
});

describe('gridCursorSpaceId', () => {
  it('builds a stable room-scoped key', () => {
    expect(gridCursorSpaceId({ type: 'board', id: 'abc123' })).toBe(
      'grid-cursors--board-abc123',
    );
  });
});
