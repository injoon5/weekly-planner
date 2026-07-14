import { NEXT_DAY_START_SLOT, SLOTS, SLOT_MIN } from './config.js';
import { pack } from './models.js';
import { layout } from './tokens.stylex.js';

const GRID_BODY_HEIGHT_PROPERTY = '--grid-body-height';
const GRID_HOUR_HEIGHT_PROPERTY = '--grid-hour-height';
const GRID_NEXT_DAY_TOP_PROPERTY = '--grid-next-day-top';

export function gridGeometryStyle() {
  return {
    [GRID_BODY_HEIGHT_PROPERTY]: `calc(${layout.slotH} * ${SLOTS})`,
    [GRID_HOUR_HEIGHT_PROPERTY]: `calc(${layout.slotH} * ${60 / SLOT_MIN})`,
    [GRID_NEXT_DAY_TOP_PROPERTY]: `calc(${layout.slotH} * ${NEXT_DAY_START_SLOT})`,
  };
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

export function slotTop(minutes) {
  return `calc(${layout.slotH} * ${minutes / SLOT_MIN})`;
}

export function slotHeight(minutes) {
  return `calc(${layout.slotH} * ${minutes / SLOT_MIN} - 2px)`;
}

export function chipStyle(drag, dayCount = 7) {
  const n = dayCount || 7;
  const visualCol = drag.visualCol ?? 0;
  return {
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${(visualCol / n).toFixed(6)} + 6px)`,
    top:
      drag.start >= SLOT_MIN * 2
        ? `calc(${layout.slotH} * ${drag.start / SLOT_MIN} - 29px)`
        : `calc(${layout.slotH} * ${(drag.start + drag.dur) / SLOT_MIN} + 8px)`,
  };
}

export function nowLineStyle(nowMin, visualCol, dayCount = 7) {
  const n = dayCount || 7;
  return {
    top: `calc(${layout.slotH} * ${(nowMin / SLOT_MIN).toFixed(4)} - 1px)`,
    left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * ${(visualCol / n).toFixed(6)})`,
    width: `calc((100% - ${layout.gutW}) / ${n})`,
  };
}

/** Keep scroll inside real content bounds (no rubber-band into empty gutter). */
export function clampPaneScroll(pane) {
  if (!pane) return;
  const maxLeft = Math.max(0, pane.scrollWidth - pane.clientWidth);
  const maxTop = Math.max(0, pane.scrollHeight - pane.clientHeight);
  if (pane.scrollLeft < 0) pane.scrollLeft = 0;
  else if (pane.scrollLeft > maxLeft) pane.scrollLeft = maxLeft;
  if (pane.scrollTop < 0) pane.scrollTop = 0;
  else if (pane.scrollTop > maxTop) pane.scrollTop = maxTop;
}

/** Scroll pane so "now" is roughly in view when the board changes. */
export function scrollPaneToNow(pane, body, gut, nowMin, visualCol, dayCount = 7) {
  if (!pane || !body) return;
  const n = dayCount || 7;
  const slotH = body.getBoundingClientRect().height / SLOTS;
  pane.scrollTop = Math.max(0, (nowMin / SLOT_MIN) * slotH - 150);
  const canScrollX = pane.scrollWidth > pane.clientWidth + 4;
  if (canScrollX) {
    const gw = gut?.offsetWidth ?? 0;
    const colW = (body.offsetWidth - gw) / n;
    pane.scrollLeft = Math.max(0, visualCol * colW - 10);
  } else {
    pane.scrollLeft = 0;
  }
}
