import { SLOTS } from './config.js';
import { locatePointer, measureGridGeometry } from './drag.js';
import { pickLeastUsedColor } from './models.js';
import { clamp } from './time.js';

/**
 * Classify a pointerdown on the week grid into a gesture mode + payload.
 * Returns null when the event should be ignored.
 *
 * @param {{
 *   target: EventTarget | null,
 *   clientX: number,
 *   clientY: number,
 *   events: Array<{ id: string, day: number, start: number, dur: number, color?: string }>,
 *   days: number[],
 *   bodyEl: Element,
 *   gutEl: Element,
 * }} args
 */
export function classifyGridPointerDown({
  target,
  clientX,
  clientY,
  events,
  days,
  bodyEl,
  gutEl,
}) {
  const el = /** @type {Element | null} */ (target instanceof Element ? target : null);
  if (!el) return null;

  const blkEl = el.closest('[data-ev]');
  if (blkEl) {
    const ev = events.find((x) => x.id === /** @type {HTMLElement} */ (blkEl).dataset.ev);
    if (!ev) return null;
    const mode =
      /** @type {HTMLElement} */ (el).dataset.hh === 't' || el.closest('[data-hh="t"]')
        ? 'resize-top'
        : /** @type {HTMLElement} */ (el).dataset.hh === 'b' || el.closest('[data-hh="b"]')
          ? 'resize-bot'
          : 'move';
    return { mode, payload: { ev: { ...ev } } };
  }

  const col = el.closest('[data-day]');
  if (!col) return null;
  const { bodyRect, gutWidth } = measureGridGeometry(bodyEl, gutEl);
  const { slotF } = locatePointer({ x: clientX, y: clientY }, bodyRect, gutWidth, days);
  return {
    mode: 'create',
    payload: {
      day: +/** @type {HTMLElement} */ (col).dataset.day,
      anchor: clamp(Math.floor(slotF), 0, SLOTS - 1),
      color: pickLeastUsedColor(events),
    },
  };
}
