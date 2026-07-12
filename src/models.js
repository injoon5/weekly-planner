import { PALETTE } from './config.js';
import { clamp, snapDur, snapMin } from './time.js';

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

export function boardFields(input = {}, fallbackName = '시간표') {
  const name =
    typeof input.name === 'string' && input.name.trim()
      ? input.name.trim().slice(0, 40)
      : fallbackName;
  return {
    name,
    from: typeof input.from === 'string' ? input.from : '',
    to: typeof input.to === 'string' ? input.to : '',
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

/** Column packing for overlapping events in one day. */
export function pack(evs) {
  const out = new Map();
  const items = [...evs].sort((a, b) => a.start - b.start || b.dur - a.dur);
  let cluster = [];
  let ends = [];
  let maxEnd = -1;

  const flush = () => {
    for (const [ev, c] of cluster) out.set(ev.id, { col: c, cols: ends.length });
    cluster = [];
    ends = [];
    maxEnd = -1;
  };

  for (const ev of items) {
    if (cluster.length && ev.start >= maxEnd) flush();
    let c = ends.findIndex(t => t <= ev.start);
    if (c === -1) {
      c = ends.length;
      ends.push(ev.start + ev.dur);
    } else {
      ends[c] = ev.start + ev.dur;
    }
    cluster.push([ev, c]);
    maxEnd = Math.max(maxEnd, ev.start + ev.dur);
  }
  flush();
  return out;
}

export function pickLeastUsedColor(events) {
  const cnt = Object.fromEntries(PALETTE.map(c => [c, 0]));
  for (const e of events) {
    if (cnt[e.color] != null) cnt[e.color]++;
  }
  return PALETTE.reduce((a, b) => (cnt[b] < cnt[a] ? b : a));
}

export function nextBoardSortOrder(boards) {
  return boards.reduce((m, b) => Math.max(m, b.sortOrder ?? 0), -1) + 1;
}

export function nextBoardName(boards, prefix = '시간표') {
  let n = 1;
  while (boards.some(b => b.name === prefix + ' ' + n)) n++;
  return prefix + ' ' + n;
}
