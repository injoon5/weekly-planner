import { SLOTS, SLOT_MIN } from './config.js';
import { pack } from './models.js';
import { layout } from './tokens.stylex.js';

export const COMPACT_SLOT = '22px';
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function slotUnit(compact) {
  return compact ? COMPACT_SLOT : layout.slotH;
}

/** Merge live drag draft into the visible event list. */
export function mergeDragView(events, drag) {
  return events.map((e) =>
    drag && drag.kind === 'ev' && drag.id === e.id
      ? { ...e, day: drag.day, start: drag.start, dur: drag.dur }
      : e,
  );
}

/** Pack non-dragged events per day for overlap columns. */
export function packView(view, drag) {
  const m = new Map();
  for (let d = 0; d < 7; d++) {
    const list = view.filter(
      (e) => e.day === d && !(drag && drag.kind === 'ev' && drag.id === e.id),
    );
    for (const [k, v] of pack(list)) m.set(k, v);
  }
  return m;
}

/** visualCol = index in `days`; day = calendar DOW. */
export function geoX(visualCol, col, cols, dayCount = 7) {
  const n = dayCount || 7;
  return {
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${((visualCol + col / cols) / n).toFixed(6)} + 2px)`,
    width: `calc((100% - ${layout.gutW}) * ${(1 / (n * cols)).toFixed(6)} - 4px)`,
  };
}

export function slotTop(minutes, compact = false) {
  return `calc(${slotUnit(compact)} * ${minutes / SLOT_MIN})`;
}

export function slotHeight(minutes, compact = false) {
  return `calc(${slotUnit(compact)} * ${minutes / SLOT_MIN} - 2px)`;
}

export function chipStyle(drag, dayCount = 7, compact = false) {
  const n = dayCount || 7;
  const h = slotUnit(compact);
  const visualCol = drag.visualCol ?? 0;
  return {
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${(visualCol / n).toFixed(6)} + 6px)`,
    top:
      drag.start >= SLOT_MIN * 2
        ? `calc(${h} * ${drag.start / SLOT_MIN} - 29px)`
        : `calc(${h} * ${(drag.start + drag.dur) / SLOT_MIN} + 8px)`,
  };
}

export function nowLineStyle(nowMin, visualCol, dayCount = 7, compact = false) {
  const n = dayCount || 7;
  return {
    top: `calc(${slotUnit(compact)} * ${(nowMin / SLOT_MIN).toFixed(4)} - 1px)`,
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${(visualCol / n).toFixed(6)})`,
    width: `calc((100% - ${layout.gutW}) / ${n})`,
  };
}

/** Scroll pane so "now" is roughly in view when the board changes. */
export function scrollPaneToNow(pane, body, gut, nowMin, visualCol, dayCount = 7) {
  if (!pane || !body) return;
  const n = dayCount || 7;
  const slotH = body.getBoundingClientRect().height / SLOTS;
  pane.scrollTop = Math.max(0, (nowMin / SLOT_MIN) * slotH - 150);
  if (pane.scrollWidth > pane.clientWidth + 4) {
    const gw = gut?.offsetWidth ?? 0;
    const colW = (body.offsetWidth - gw) / n;
    pane.scrollLeft = Math.max(0, visualCol * colW - 10);
  }
}
