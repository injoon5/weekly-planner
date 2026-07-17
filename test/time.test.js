import { describe, expect, it } from 'vitest';

import {
  defaultBoardRange,
  diffDays,
  dt,
  fmt,
  fmtDur,
  fmtOpt,
  fmtRange,
  fmtRepeat,
  isoDate,
  nowOnGrid,
  plannerDate,
  snapDur,
  snapMin,
} from '../src/lib/time.js';

describe('time formatting', () => {
  it('formats grid-relative minutes across midnight', () => {
    expect(fmt(0)).toBe('06:00');
    expect(fmt(1079)).toBe('23:59');
    expect(fmt(1080)).toBe('00:00');
    expect(fmt(-30)).toBe('05:30');
  });

  it('formats options, durations, repeats, and ranges', () => {
    expect(fmtOpt(1080)).toBe('익일 00:00');
    expect(fmtOpt(1440)).toBe('06:00');
    expect(fmtDur(30)).toBe('30분');
    expect(fmtDur(90)).toBe('1시간 30분');
    expect(fmtRepeat(1)).toBe('매주 반복');
    expect(fmtRepeat(3)).toBe('3주마다 반복');
    expect(fmtRange('2026-12-30', '2027-01-02')).toBe('2026.12.30 – 2027.01.02');
  });
});

describe('date and grid normalization', () => {
  it('accepts only complete ISO date strings', () => {
    expect(dt('2026-07-13')).toBe('2026-07-13');
    expect(dt('2026-7-13')).toBe('');
    expect(dt(null)).toBe('');
  });

  it('uses local calendar dates for board ranges', () => {
    const now = new Date(2026, 11, 29, 23, 45);

    expect(isoDate(now)).toBe('2026-12-29');
    expect(defaultBoardRange(now)).toEqual({
      from: '2026-12-29',
      to: '2027-01-05',
    });
    expect(diffDays('2026-12-29', '2027-01-05')).toBe(7);
  });

  it('snaps starts and durations to valid half-hour slots', () => {
    expect(snapMin(44)).toBe(30);
    expect(snapMin(-100)).toBe(0);
    expect(snapMin(2000)).toBe(1410);
    expect(snapDur(1380, 200)).toBe(60);
    expect(snapDur(60, 0)).toBe(30);
  });

  it('assigns pre-06:00 times to the previous grid day', () => {
    const earlyMonday = new Date(2026, 6, 13, 5, 30);

    expect(nowOnGrid(earlyMonday)).toEqual({
      nowMin: 1410,
      nowDay: 0,
    });
  });

  it('keeps the planner day on the same 06:00→06:00 window', () => {
    // 05:30 still belongs to the previous calendar day…
    expect(plannerDate(new Date(2026, 6, 13, 5, 30))).toBe('2026-07-12');
    // …06:00 flips to the new day…
    expect(plannerDate(new Date(2026, 6, 13, 6, 0))).toBe('2026-07-13');
    // …and it holds through the late evening.
    expect(plannerDate(new Date(2026, 6, 13, 23, 45))).toBe('2026-07-13');
  });
});
