import { describe, expect, it } from 'vitest';

import {
  boardCoversDate,
  boardFields,
  eventFields,
  fromInstantEvents,
  fromInstantTodos,
  nextBoardName,
  nextBoardSortOrder,
  pack,
  pickLeastUsedColor,
  repeatWeeksOf,
  todoFields,
} from '../src/models.js';

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

  it('maps Instant events with done state', () => {
    expect(
      fromInstantEvents([
        {
          id: 'e1',
          day: 1,
          start: 60,
          dur: 60,
          title: 'Class',
          color: 'sky',
          done: true,
        },
      ]),
    ).toEqual([
      {
        id: 'e1',
        day: 1,
        start: 60,
        dur: 60,
        title: 'Class',
        memo: '',
        color: 'sky',
        done: true,
      },
    ]);
  });

  it('normalizes and sorts freeform todos', () => {
    expect(
      todoFields({ day: 9, text: '  buy milk  ', done: 1, sortOrder: 3 }),
    ).toEqual({
      day: 6,
      text: 'buy milk',
      done: true,
      sortOrder: 3,
    });

    expect(
      fromInstantTodos([
        { id: 't2', day: 2, text: 'Later', done: false, sortOrder: 2, createdAt: 20 },
        { id: 't1', day: 2, text: 'First', done: true, sortOrder: 1, createdAt: 10 },
      ]),
    ).toEqual([
      {
        id: 't1',
        day: 2,
        text: 'First',
        done: true,
        sortOrder: 1,
        createdAt: 10,
      },
      {
        id: 't2',
        day: 2,
        text: 'Later',
        done: false,
        sortOrder: 2,
        createdAt: 20,
      },
    ]);
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
    const packed = pack([
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
    expect(nextBoardName([{ name: '시간표 1' }, { name: '시간표 3' }])).toBe('시간표 2');
  });
});
