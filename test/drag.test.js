import { describe, expect, it, vi } from 'vitest';
import {
  beginPointerGesture,
  draftFromGesture,
  edgeScrollDelta,
  shouldCancelTouchForScroll,
  shouldCancelTouchHold,
} from '../src/drag.js';

describe('edgeScrollDelta', () => {
  const paneRect = { left: 0, top: 0, right: 400, bottom: 600 };
  const gutWidth = 48;
  const headHeight = 40;

  it('scrolls down when the pointer is near the bottom edge', () => {
    const { dy } = edgeScrollDelta(
      { x: 200, y: 580 },
      paneRect,
      gutWidth,
      headHeight,
    );
    expect(dy).toBeGreaterThan(0);
  });

  it('scrolls up when the pointer is near the top edge', () => {
    const { dy } = edgeScrollDelta(
      { x: 200, y: 50 },
      paneRect,
      gutWidth,
      headHeight,
    );
    expect(dy).toBeLessThan(0);
  });

  it('does not scroll when the pointer is in the middle', () => {
    const { dx, dy } = edgeScrollDelta(
      { x: 200, y: 300 },
      paneRect,
      gutWidth,
      headHeight,
    );
    expect(dx).toBe(0);
    expect(dy).toBe(0);
  });
});

describe('draftFromGesture create', () => {
  it('extends the draft from the anchor slot', () => {
    const session = {
      mode: 'create',
      payload: { day: 1, anchor: 8, color: 'graphite' },
      days: [0, 1, 2, 3, 4, 5, 6],
    };
    const bodyRect = { left: 0, top: 0, width: 700, height: 1440 };
    const draft = draftFromGesture(session, { x: 200, y: 360 }, bodyRect, 48);
    expect(draft.kind).toBe('new');
    expect(draft.start).toBe(240);
    expect(draft.dur).toBe(150);
  });
});

describe('touch scroll disambiguation', () => {
  it('cancels on large movement', () => {
    expect(shouldCancelTouchForScroll(0, 14)).toBe(true);
    expect(shouldCancelTouchForScroll(14, 0)).toBe(true);
  });

  it('cancels on axis-dominant movement before the large threshold', () => {
    expect(shouldCancelTouchForScroll(10, 1)).toBe(true);
    expect(shouldCancelTouchForScroll(1, 10)).toBe(true);
  });

  it('keeps a still finger eligible for long-press', () => {
    expect(shouldCancelTouchForScroll(2, 1)).toBe(false);
    expect(shouldCancelTouchHold(3)).toBe(false);
  });

  it('drops long-press after small jitter', () => {
    expect(shouldCancelTouchHold(6)).toBe(true);
  });
});

describe('beginPointerGesture scroll lock', () => {
  function makeGrid() {
    const paneEl = {
      style: { touchAction: '' },
      scrollWidth: 400,
      clientWidth: 400,
      scrollBy: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 400, bottom: 600 }),
    };
    const bodyEl = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      getBoundingClientRect: () => ({ left: 0, top: 40, width: 400, height: 1400 }),
    };
    const gutEl = {
      getBoundingClientRect: () => ({ width: 48 }),
    };
    const hrowEl = { offsetHeight: 40 };
    return { paneEl, bodyEl, gutEl, hrowEl };
  }

  it('locks pane touch-action after touch long-press activates', () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { paneEl, bodyEl, gutEl, hrowEl } = makeGrid();
    const onDraft = vi.fn();
    const onResult = vi.fn();

    beginPointerGesture(
      {
        pointerType: 'touch',
        pointerId: 1,
        clientX: 120,
        clientY: 200,
        button: 0,
      },
      {
        mode: 'create',
        payload: { day: 1, anchor: 8, color: 'graphite' },
        bodyEl,
        gutEl,
        hrowEl,
        paneEl,
        onDraft,
        onResult,
      },
    );

    expect(paneEl.style.touchAction).toBe('');

    vi.advanceTimersByTime(300);

    expect(paneEl.style.touchAction).toBe('none');
    expect(onDraft).toHaveBeenCalled();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
