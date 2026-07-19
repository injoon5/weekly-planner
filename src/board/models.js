import { PALETTE } from '../lib/config.js';
import { clamp, diffDays, dt, fmt, isoDate, snapDur, snapMin } from '../lib/time.js';

/** Normalize a loose event-shaped object into app invariants. */
export function eventFields(input = {}) {
  const day = clamp(Math.round(+input.day) || 0, 0, 6);
  const start = snapMin(input.start);
  const dur = snapDur(start, input.dur);
  return {
    day,
    start,
    dur,
    title: typeof input.title === 'string' ? input.title.slice(0, 80) : '',
    memo: typeof input.memo === 'string' ? input.memo.slice(0, 300) : '',
    color: PALETTE.includes(input.color) ? input.color : 'sky',
  };
}

/** Repeat cadence in weeks (0 = one-off period). */
export function repeatWeeksOf(input) {
  return clamp(Math.round(+input) || 0, 0, 8);
}

/**
 * Whether a board's period covers `iso`. A repeating board is anchored at
 * `from` and recurs every `repeatEvery` weeks; its active window per cycle is
 * the original from→to span (capped at one cycle).
 */
export function boardCoversDate(board, iso = isoDate()) {
  const from = dt(board?.from || '');
  const to = dt(board?.to || '');
  const repeat = repeatWeeksOf(board?.repeatEvery);
  if (!repeat) {
    if (from && to) return from <= iso && iso <= to;
    if (from) return from <= iso;
    if (to) return iso <= to;
    return false;
  }
  if (!from) return true;
  if (iso < from) return false;
  const cycle = repeat * 7;
  const len = to && to >= from ? Math.min(diffDays(from, to) + 1, cycle) : cycle;
  return diffDays(from, iso) % cycle < len;
}

export function boardFields(input = {}, fallbackName = '시간표') {
  const name =
    typeof input.name === 'string' && input.name.trim()
      ? input.name.trim().slice(0, 40)
      : fallbackName;
  return {
    name,
    from: typeof input.from === 'string' ? input.from : '',
    to: typeof input.to === 'string' ? input.to : '',
    repeatEvery: repeatWeeksOf(input.repeatEvery),
    events: Array.isArray(input.events) ? input.events.map(e => eventFields(e)) : [],
  };
}

/** Map Instant event rows → UI events. */
export function fromInstantEvents(rows) {
  return (rows || []).map(e => ({
    id: e.id,
    ...eventFields(e),
  }));
}

/** Weekday (0=Sun) for a planner ISO date (`YYYY-MM-DD`, 06:00→06:00 day). */
export function weekdayFromPlannerDate(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d).getDay();
}

/**
 * Derive today's to-do rows from board events for `weekday`.
 * `checkedBy` is a Map/Set of eventIds marked done (or a Map of eventId → rows).
 * Pure — schedule edits flow through here on every events change.
 */
export function buildTodayTodos(events, weekday, checkedBy) {
  const isDone = (id) => {
    if (!checkedBy) return false;
    if (typeof checkedBy.has === 'function') return checkedBy.has(id);
    return Boolean(checkedBy[id]);
  };
  return (events || [])
    .filter((e) => e.day === weekday)
    .sort((a, b) => a.start - b.start || a.dur - b.dur)
    .map((e) => ({
      id: e.id,
      text: e.title || '',
      time: fmt(e.start),
      done: isDone(e.id),
    }));
}

export function pickLeastUsedColor(events) {
  const cnt = Object.fromEntries(PALETTE.map(c => [c, 0]));
  for (const e of events) {
    if (cnt[e.color] != null) cnt[e.color]++;
  }
  return PALETTE.reduce((a, b) => (cnt[b] < cnt[a] ? b : a));
}

/** Canonical board ordering: sortOrder, then createdAt as a stable tiebreak. */
export function boardOrderComparator(a, b) {
  return (
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0)
  );
}

/** Boards in canonical order (input untouched). */
export function sortBoards(boards) {
  return (boards || []).toSorted(boardOrderComparator);
}

export function nextBoardSortOrder(boards) {
  return boards.reduce((m, b) => Math.max(m, b.sortOrder ?? 0), -1) + 1;
}

export function nextBoardName(boards, prefix = '시간표') {
  let n = 1;
  while (boards.some(b => b.name === prefix + ' ' + n)) n++;
  return prefix + ' ' + n;
}
