import { describe, expect, it, vi } from 'vitest';
import {
  beginPointerGesture,
  draftFromGesture,
  edgeScrollDelta,
  reducePendingPointerMove,
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

  it('tolerates platform-typical jitter but drops long-press past the slop', () => {
    expect(shouldCancelTouchHold(7)).toBe(false);
    expect(shouldCancelTouchHold(9)).toBe(true);
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

  it('cancels a pending long-press when a second finger lands', () => {
    vi.useFakeTimers();
    const listeners = {};
    vi.stubGlobal('window', {
      addEventListener: (type, fn) => {
        (listeners[type] ||= []).push(fn);
      },
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

    listeners.pointerdown.forEach((fn) => fn({ pointerId: 2 }));

    expect(onResult).toHaveBeenCalledWith({ type: 'noop' });

    vi.advanceTimersByTime(300);
    expect(paneEl.style.touchAction).toBe('');
    expect(onDraft).toHaveBeenCalledWith(null);
    expect(onDraft).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('coalesces active-phase moves into the animation frame loop', () => {
    vi.useFakeTimers();
    const listeners = {};
    const frames = [];
    vi.stubGlobal('window', {
      addEventListener: (type, fn) => {
        (listeners[type] ||= []).push(fn);
      },
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((fn) => frames.push(fn)),
    );
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

    vi.advanceTimersByTime(300); // long-press activates, draft applied once
    const draftsAfterActivate = onDraft.mock.calls.length;

    // Two moves before the next frame: no synchronous draft recompute.
    listeners.pointermove.forEach((fn) => fn({ pointerId: 1, clientX: 120, clientY: 400 }));
    listeners.pointermove.forEach((fn) => fn({ pointerId: 1, clientX: 120, clientY: 500 }));
    expect(onDraft.mock.calls.length).toBe(draftsAfterActivate);

    // The frame applies the latest position in one shot.
    frames.splice(0).forEach((fn) => fn());
    expect(onDraft.mock.calls.length).toBe(draftsAfterActivate + 1);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

describe('reducePendingPointerMove', () => {
  it('activates mouse after small movement', () => {
    expect(
      reducePendingPointerMove({ isTouch: false }, { dx: 5, dy: 0, dist: 5 }),
    ).toEqual({ type: 'activate' });
  });

  it('cancels touch when scroll intent is clear', () => {
    expect(
      reducePendingPointerMove({ isTouch: true }, { dx: 0, dy: 20, dist: 20 }),
    ).toEqual({ type: 'finish', result: { type: 'noop' } });
  });

  it('cancels the long-press timer when hold slop is exceeded', () => {
    expect(
      reducePendingPointerMove({ isTouch: true }, { dx: 6, dy: 6, dist: 9 }),
    ).toEqual({ type: 'cancel-timer' });
  });
});
