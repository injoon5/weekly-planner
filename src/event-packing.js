/** Column packing for overlapping events in one day. */
export function packOverlappingEvents(evs) {
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
    let c = ends.findIndex((t) => t <= ev.start);
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
