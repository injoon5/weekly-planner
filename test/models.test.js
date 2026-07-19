import { describe, expect, it } from 'vitest';

import {
  boardCoversDate,
  boardFields,
  buildTodayTodos,
  eventFields,
  nextBoardName,
  nextBoardSortOrder,
  pickLeastUsedColor,
  repeatWeeksOf,
  sortBoards,
  weekdayFromPlannerDate,
} from '../src/board/models.js';
import { packOverlappingEvents } from '../src/grid/event-packing.js';

describe('model normalization', () => {
  it('normalizes loose event input into app invariants', () => {
    expect(
      eventFields({
        day: 9,
        start: 44,
        dur: 0,
        title: 'x'.repeat(90),
        memo: 'm'.repeat(310),
        color: 'not-a-color',
      }),
    ).toEqual({
      day: 6,
      start: 30,
      dur: 30,
      title: 'x'.repeat(80),
      memo: 'm'.repeat(300),
      color: 'sky',
    });
  });

  it('normalizes boards and nested events without mutating the input', () => {
    const event = { day: 2, start: 61, dur: 59, title: 'Standup', color: 'teal' };
    const input = {
      name: '  Team week  ',
      from: '2026-07-13',
      to: '2026-07-19',
      repeatEvery: 12,
      events: [event],
    };

    expect(boardFields(input)).toEqual({
      name: 'Team week',
      from: '2026-07-13',
      to: '2026-07-19',
      repeatEvery: 8,
      events: [
        {
          day: 2,
          start: 60,
          dur: 60,
          title: 'Standup',
          memo: '',
          color: 'teal',
        },
      ],
    });
    expect(event).toEqual({ day: 2, start: 61, dur: 59, title: 'Standup', color: 'teal' });
  });

  it('clamps repeat cadence', () => {
    expect(repeatWeeksOf(-1)).toBe(0);
    expect(repeatWeeksOf(2.6)).toBe(3);
    expect(repeatWeeksOf(20)).toBe(8);
  });
});

describe('board date coverage', () => {
  it('handles bounded and open-ended one-off boards', () => {
    expect(
      boardCoversDate({ from: '2026-07-13', to: '2026-07-19' }, '2026-07-16'),
    ).toBe(true);
    expect(
      boardCoversDate({ from: '2026-07-13', to: '2026-07-19' }, '2026-07-20'),
    ).toBe(false);
    expect(boardCoversDate({ from: '2026-07-13' }, '2027-01-01')).toBe(true);
  });

  it('applies the original active window in repeating cycles', () => {
    const board = {
      from: '2026-07-13',
      to: '2026-07-15',
      repeatEvery: 2,
    };

    expect(boardCoversDate(board, '2026-07-27')).toBe(true);
    expect(boardCoversDate(board, '2026-07-29')).toBe(true);
    expect(boardCoversDate(board, '2026-07-30')).toBe(false);
    expect(boardCoversDate(board, '2026-07-12')).toBe(false);
  });
});

describe('event packing and board helpers', () => {
  it('packs overlapping events into reusable columns', () => {
    const packed = packOverlappingEvents([
      { id: 'a', start: 0, dur: 60 },
      { id: 'b', start: 30, dur: 60 },
      { id: 'c', start: 60, dur: 60 },
      { id: 'd', start: 180, dur: 30 },
    ]);

    expect(Object.fromEntries(packed)).toEqual({
      a: { col: 0, cols: 2 },
      b: { col: 1, cols: 2 },
      c: { col: 0, cols: 2 },
      d: { col: 0, cols: 1 },
    });
  });

  it('selects stable least-used values and next board metadata', () => {
    expect(pickLeastUsedColor([{ color: 'coral' }, { color: 'coral' }])).toBe('amber');
    expect(nextBoardSortOrder([{ sortOrder: 2 }, { sortOrder: 8 }, {}])).toBe(9);
  });

  it('sorts boards by sortOrder then createdAt without mutating input', () => {
    const boards = [
      { id: 'b', sortOrder: 1, createdAt: 5 },
      { id: 'a', sortOrder: 0, createdAt: 9 },
      { id: 'c', sortOrder: 1, createdAt: 2 },
      { id: 'd' },
    ];
    expect(sortBoards(boards).map((b) => b.id)).toEqual(['d', 'a', 'c', 'b']);
    expect(boards[0].id).toBe('b');
    expect(sortBoards(null)).toEqual([]);
    expect(nextBoardName([{ name: '시간표 1' }, { name: '시간표 3' }])).toBe('시간표 2');
  });
});

describe('today todos from schedule', () => {
  it('maps planner ISO dates to local weekdays', () => {
    // 2026-07-13 is a Monday
    expect(weekdayFromPlannerDate('2026-07-13')).toBe(1);
    expect(weekdayFromPlannerDate('2026-07-12')).toBe(0);
  });

  it('live-derives today\'s list from events: filter, sort, check state', () => {
    const events = [
      { id: 'b', day: 1, start: 120, dur: 60, title: 'Later' },
      { id: 'a', day: 1, start: 60, dur: 30, title: 'Earlier' },
      { id: 'c', day: 2, start: 60, dur: 30, title: 'Tomorrow' },
    ];
    const checked = new Map([['a', ['row-1']]]);

    expect(buildTodayTodos(events, 1, checked)).toEqual([
      { id: 'a', text: 'Earlier', time: '07:00', done: true },
      { id: 'b', text: 'Later', time: '08:00', done: false },
    ]);
  });

  it('reflects schedule edits: title, time, day moves, and deletes', () => {
    let events = [
      { id: 'a', day: 1, start: 60, dur: 30, title: 'Standup' },
      { id: 'b', day: 1, start: 180, dur: 60, title: 'Deep work' },
    ];
    expect(buildTodayTodos(events, 1, new Set()).map((t) => t.text)).toEqual([
      'Standup',
      'Deep work',
    ]);

    // Rename + reschedule
    events = [
      { id: 'a', day: 1, start: 90, dur: 30, title: 'Daily' },
      { id: 'b', day: 1, start: 180, dur: 60, title: 'Deep work' },
    ];
    expect(buildTodayTodos(events, 1, new Set())).toEqual([
      { id: 'a', text: 'Daily', time: '07:30', done: false },
      { id: 'b', text: 'Deep work', time: '09:00', done: false },
    ]);

    // Move off today
    events = [
      { id: 'a', day: 3, start: 90, dur: 30, title: 'Daily' },
      { id: 'b', day: 1, start: 180, dur: 60, title: 'Deep work' },
    ];
    expect(buildTodayTodos(events, 1, new Set()).map((t) => t.id)).toEqual(['b']);

    // Delete
    events = [{ id: 'b', day: 1, start: 180, dur: 60, title: 'Deep work' }];
    expect(buildTodayTodos(events, 1, new Set()).map((t) => t.id)).toEqual(['b']);
    expect(buildTodayTodos([], 1, new Set())).toEqual([]);
  });
});
