import { SLOTS, SLOT_MIN } from './config.js';
import { pack } from './models.js';
import { layout } from './tokens.stylex.js';

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

export function geoX(day, col, cols) {
  return {
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${((day + col / cols) / 7).toFixed(6)} + 2px)`,
    width: `calc((100% - ${layout.gutW}) * ${(1 / (7 * cols)).toFixed(6)} - 4px)`,
  };
}

export function slotTop(minutes) {
  return `calc(${layout.slotH} * ${minutes / SLOT_MIN})`;
}

export function slotHeight(minutes) {
  return `calc(${layout.slotH} * ${minutes / SLOT_MIN} - 2px)`;
}

export function chipStyle(drag) {
  return {
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${(drag.day / 7).toFixed(6)} + 6px)`,
    top:
      drag.start >= SLOT_MIN * 2
        ? `calc(${layout.slotH} * ${drag.start / SLOT_MIN} - 29px)`
        : `calc(${layout.slotH} * ${(drag.start + drag.dur) / SLOT_MIN} + 8px)`,
  };
}

export function nowLineStyle(nowMin, nowDay) {
  return {
    top: `calc(${layout.slotH} * ${(nowMin / SLOT_MIN).toFixed(4)} - 1px)`,
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${(nowDay / 7).toFixed(6)})`,
    width: `calc((100% - ${layout.gutW}) / 7)`,
  };
}

/** Scroll pane so "now" is roughly in view when the board changes. */
export function scrollPaneToNow(pane, body, gut, nowMin, nowDay) {
  if (!pane || !body) return;
  const slotH = body.getBoundingClientRect().height / SLOTS;
  pane.scrollTop = Math.max(0, (nowMin / SLOT_MIN) * slotH - 150);
  if (pane.scrollWidth > pane.clientWidth + 4) {
    const gw = gut?.offsetWidth ?? 0;
    const colW = (body.offsetWidth - gw) / 7;
    pane.scrollLeft = Math.max(0, nowDay * colW - 10);
  }
}
