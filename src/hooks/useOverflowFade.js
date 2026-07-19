import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/**
 * Edge-fade state for a horizontally scrollable strip whose scrollbar is
 * hidden (board tabs, color swatches): fades mark the clipped edge so
 * overflowing content doesn't just look cut off.
 *
 * Owns the fade state, a ResizeObserver on the strip, and a wheel handler
 * that turns plain vertical wheel input into sideways scroll (narrow desktop
 * windows have no other pointer affordance; trackpads already send deltaX).
 *
 * Content-only changes (e.g. more tabs at the same strip width) don't fire
 * the ResizeObserver — call `updateFade` from the caller's own effect then.
 *
 * @param {import('react').RefObject<HTMLElement | null>} rowRef
 */
export function useOverflowFade(rowRef) {
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFade = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  }, [rowRef]);

  useLayoutEffect(() => {
    updateFade();
  }, [updateFade]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFade);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rowRef, updateFade]);

  const onWheel = useCallback(
    (e) => {
      const el = rowRef.current;
      if (!el || el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      el.scrollLeft += e.deltaY;
    },
    [rowRef],
  );

  return { fade, updateFade, onWheel };
}

/** Map the edge state onto a caller's StyleX fade variants. */
export function pickFadeStyle(fade, { both, left, right }) {
  if (fade.left && fade.right) return both;
  if (fade.left) return left;
  if (fade.right) return right;
  return null;
}
