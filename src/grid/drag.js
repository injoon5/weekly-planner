import { DAY_MIN, SLOT_MIN, SLOTS } from '../lib/config.js';
import { clamp } from '../lib/time.js';

/**
 * Pure draft math for calendar gestures.
 * DOM capture / listeners stay in the caller; this only maps pointer → draft / commit.
 */

const DEFAULT_DAYS = [0, 1, 2, 3, 4, 5, 6];
const EDGE_SCROLL_MARGIN = 36;
const TOUCH_SCROLL_CANCEL_DIST = 12;
// Platform long-press slop is ~8-10 CSS px (Android 8dp, iOS ~10pt); tighter
// values make a resting thumb's jitter kill the hold and misread the lift as a tap.
const TOUCH_HOLD_MOVE_LIMIT = 8;
const TOUCH_AXIS_SCROLL_DIST = 7;
const TOUCH_AXIS_RATIO = 1.65;
const TOUCH_LONG_PRESS_MS = 300;

/** Decide whether a pending touch gesture should yield to native scroll. */
export function shouldCancelTouchForScroll(dx, dy, dist = Math.hypot(dx, dy)) {
  if (dist > TOUCH_SCROLL_CANCEL_DIST) return true;
  if (dist < TOUCH_AXIS_SCROLL_DIST) return false;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  return ax > ay * TOUCH_AXIS_RATIO || ay > ax * TOUCH_AXIS_RATIO;
}

/** Whether a pending touch still qualifies for long-press activation. */
export function shouldCancelTouchHold(dist) {
  return dist > TOUCH_HOLD_MOVE_LIMIT;
}

export function locatePointer(point, bodyRect, gutWidth, days = DEFAULT_DAYS) {
  const n = days.length || 7;
  const colW = (bodyRect.width - gutWidth) / n;
  const col = clamp(Math.floor((point.x - bodyRect.left - gutWidth) / colW), 0, n - 1);
  const slotH = bodyRect.height / SLOTS;
  return {
    slotF: (point.y - bodyRect.top) / slotH,
    col,
    day: days[col] ?? col,
  };
}

export function measureGridGeometry(bodyEl, gutEl) {
  return {
    bodyRect: bodyEl.getBoundingClientRect(),
    gutWidth: gutEl.getBoundingClientRect().width,
  };
}

function sameDraft(a, b) {
  return (
    a &&
    b &&
    a.day === b.day &&
    a.start === b.start &&
    a.dur === b.dur &&
    a.kind === b.kind &&
    a.id === b.id
  );
}

export function draftFromGesture(session, point, bodyRect, gutWidth) {
  const days = session.days || DEFAULT_DAYS;
  const l = locatePointer(point, bodyRect, gutWidth, days);

  if (session.mode === 'create') {
    const b = clamp(Math.floor(l.slotF), 0, SLOTS - 1);
    const lo = Math.min(session.payload.anchor, b);
    const hi = Math.max(session.payload.anchor, b) + 1;
    return {
      kind: 'new',
      color: session.payload.color,
      day: session.payload.day,
      start: lo * SLOT_MIN,
      dur: (hi - lo) * SLOT_MIN,
    };
  }

  const ev = session.payload.ev;
  if (session.mode === 'move') {
    const col = clamp(l.col - session.offCol, 0, days.length - 1);
    const day = days[col];
    const start =
      clamp(Math.floor(l.slotF) - session.offSlot, 0, SLOTS - ev.dur / SLOT_MIN) * SLOT_MIN;
    return { kind: 'ev', id: ev.id, day, start, dur: ev.dur };
  }

  if (session.mode === 'resize-top') {
    const endSlot = (ev.start + ev.dur) / SLOT_MIN;
    const ns = clamp(Math.round(l.slotF), 0, endSlot - 1);
    return { kind: 'ev', id: ev.id, day: ev.day, start: ns * SLOT_MIN, dur: (endSlot - ns) * SLOT_MIN };
  }

  // resize-bot
  const startSlot = ev.start / SLOT_MIN;
  const ne = clamp(Math.round(l.slotF), startSlot + 1, SLOTS);
  return { kind: 'ev', id: ev.id, day: ev.day, start: ev.start, dur: (ne - startSlot) * SLOT_MIN };
}

export function activateOffsets(session, point, bodyRect, gutWidth) {
  if (session.mode !== 'move') return session;
  const days = session.days || DEFAULT_DAYS;
  const l = locatePointer(point, bodyRect, gutWidth, days);
  const evCol = days.indexOf(session.payload.ev.day);
  return {
    ...session,
    offSlot: Math.floor(l.slotF) - session.payload.ev.start / SLOT_MIN,
    offCol: l.col - (evCol < 0 ? 0 : evCol),
  };
}

export function resolvePendingTap(session) {
  if (session.mode === 'create') {
    const start = Math.min(session.payload.anchor * SLOT_MIN, DAY_MIN - SLOT_MIN * 2);
    return {
      type: 'open-create',
      draft: {
        day: session.payload.day,
        start,
        dur: SLOT_MIN * 2,
        title: '',
        color: session.payload.color,
        memo: '',
      },
    };
  }
  return { type: 'open-edit', id: session.payload.ev.id };
}

export function resolveActiveUp(session) {
  const d = session.draft;
  if (!d) return { type: 'noop' };
  if (d.kind === 'ev') {
    return { type: 'patch', id: d.id, patch: { day: d.day, start: d.start, dur: d.dur } };
  }
  return {
    type: 'open-create',
    draft: {
      day: d.day,
      start: d.start,
      dur: d.dur,
      title: '',
      color: d.color,
      memo: '',
    },
  };
}

export function edgeScrollDelta(
  pointer,
  paneRect,
  gutWidth,
  headHeight,
  margin = EDGE_SCROLL_MARGIN,
  allowHorizontal = true,
) {
  const L = paneRect.left + gutWidth + 6;
  const R = paneRect.right - 6;
  const T = paneRect.top + headHeight + 4;
  const B = paneRect.bottom - 6;
  let dx = 0;
  let dy = 0;
  if (allowHorizontal) {
    if (pointer.x < L + margin) dx = -Math.ceil(clamp(1 - (pointer.x - L) / margin, 0, 1) * 15);
    else if (pointer.x > R - margin) dx = Math.ceil(clamp(1 - (R - pointer.x) / margin, 0, 1) * 15);
  }
  if (pointer.y < T + margin) dy = -Math.ceil(clamp(1 - (pointer.y - T) / margin, 0, 1) * 15);
  else if (pointer.y > B - margin) dy = Math.ceil(clamp(1 - (B - pointer.y) / margin, 0, 1) * 15);
  return { dx, dy };
}

/**
 * Pure pending-phase transition for pointer moves.
 * @returns {{ type: 'continue' } | { type: 'activate' } | { type: 'cancel-timer' } | { type: 'finish', result: { type: 'noop' } }}
 */
export function reducePendingPointerMove(session, { dx, dy, dist }) {
  if (session.isTouch) {
    if (shouldCancelTouchForScroll(dx, dy, dist)) {
      return { type: 'finish', result: { type: 'noop' } };
    }
    if (shouldCancelTouchHold(dist)) return { type: 'cancel-timer' };
    return { type: 'continue' };
  }
  if (dist > 4) return { type: 'activate' };
  return { type: 'continue' };
}

/**
 * DOM adapter for pointer gestures. Pure math lives above; this owns listeners.
 */
export function beginPointerGesture(e, {
  mode,
  payload,
  bodyEl,
  gutEl,
  hrowEl,
  paneEl,
  days = DEFAULT_DAYS,
  onDraft,
  onResult,
}) {
  const isTouch = e.pointerType !== 'mouse';
  let session = {
    mode,
    payload,
    days,
    isTouch,
    ptr: e.pointerId,
    phase: 'pending',
    x0: e.clientX,
    y0: e.clientY,
    last: { x: e.clientX, y: e.clientY },
    draft: null,
    dirty: false,
    offSlot: 0,
    offCol: 0,
    tmr: 0,
    raf: 0,
  };

  const metrics = () => ({
    ...measureGridGeometry(bodyEl, gutEl),
    paneRect: paneEl.getBoundingClientRect(),
    headHeight: hrowEl.offsetHeight,
  });

  const setDraft = d => {
    if (sameDraft(session.draft, d)) return;
    session.draft = d;
    onDraft(d);
  };

  const apply = point => {
    const m = metrics();
    setDraft(draftFromGesture(session, point, m.bodyRect, m.gutWidth));
  };

  const blockScroll = ev => {
    if (session.phase === 'active') ev.preventDefault();
  };

  let savedPaneTouchAction = '';

  // touch-action changes don't affect a pointer sequence already in flight —
  // the dragging finger is handled by the non-passive touchmove blocker above.
  // This lock is for any *second* finger: at its touchstart the pane computes
  // touch-action:none, so it can't scroll the grid out from under the drag.
  const lockPaneScroll = () => {
    savedPaneTouchAction = paneEl.style.touchAction;
    paneEl.style.touchAction = 'none';
  };

  const unlockPaneScroll = () => {
    paneEl.style.touchAction = savedPaneTouchAction;
  };

  const edgeLoop = () => {
    if (session.phase !== 'active') return;
    const m = metrics();
    const allowHorizontal = paneEl.scrollWidth > paneEl.clientWidth + 4;
    const { dx, dy } = edgeScrollDelta(
      session.last,
      m.paneRect,
      m.gutWidth,
      m.headHeight,
      EDGE_SCROLL_MARGIN,
      allowHorizontal,
    );
    if (dx || dy) paneEl.scrollBy(dx, dy);
    if (dx || dy || session.dirty) {
      session.dirty = false;
      apply(session.last); // re-measures: scrollBy moved the grid under the pointer
    }
    session.raf = requestAnimationFrame(edgeLoop);
  };

  const activate = () => {
    if (session.phase !== 'pending') return;
    if (session.isTouch) {
      const d = Math.hypot(session.last.x - session.x0, session.last.y - session.y0);
      if (shouldCancelTouchHold(d)) return;
    }
    session.phase = 'active';
    clearTimeout(session.tmr);
    try {
      bodyEl.setPointerCapture(session.ptr);
    } catch {
      /* ignore */
    }
    lockPaneScroll();
    if (session.isTouch) {
      paneEl.addEventListener('touchmove', blockScroll, { passive: false });
    } else {
      paneEl.addEventListener('wheel', blockScroll, { passive: false });
    }
    if (session.isTouch && navigator.vibrate) navigator.vibrate(8);
    const m = metrics();
    session = activateOffsets(session, session.last, m.bodyRect, m.gutWidth);
    apply(session.last);
    edgeLoop();
  };

  // Every exit path must report a result — the caller tracks the live gesture
  // and only releases it via onResult. A silent teardown (e.g. touch turning
  // into a scroll) would leave the grid ignoring all further pointerdowns.
  const finish = result => {
    if (session.phase === 'done') return;
    session.phase = 'done';
    clearTimeout(session.tmr);
    cancelAnimationFrame(session.raf);
    try {
      bodyEl.releasePointerCapture(session.ptr);
    } catch {
      /* ignore */
    }
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('pointerdown', extraPointer);
    window.removeEventListener('keydown', key);
    window.removeEventListener('blur', bail);
    paneEl.removeEventListener('touchmove', blockScroll);
    paneEl.removeEventListener('wheel', blockScroll);
    unlockPaneScroll();
    onDraft(null);
    onResult(result);
  };

  const move = ev => {
    if (ev.pointerId !== session.ptr) return;
    session.last = { x: ev.clientX, y: ev.clientY };
    if (session.phase === 'pending') {
      const dx = ev.clientX - session.x0;
      const dy = ev.clientY - session.y0;
      const dist = Math.hypot(dx, dy);
      const transition = reducePendingPointerMove(session, { dx, dy, dist });
      switch (transition.type) {
        case 'finish':
          finish(transition.result);
          break;
        case 'activate':
          activate();
          break;
        case 'cancel-timer':
          clearTimeout(session.tmr);
          session.tmr = 0;
          break;
        case 'continue':
        default:
          break;
      }
      return;
    }
    // Active: coalesce into the edge-scroll rAF loop instead of laying out
    // per pointermove — touch screens report at up to 120Hz.
    session.dirty = true;
  };

  const up = ev => {
    if (ev.pointerId !== session.ptr) return;
    if (session.phase === 'pending') {
      finish(resolvePendingTap(session));
      return;
    }
    if (session.dirty) apply(session.last); // flush a move the rAF loop hasn't drawn yet
    finish(resolveActiveUp(session));
  };

  const cancel = ev => {
    if (ev.pointerId === session.ptr) finish({ type: 'noop' });
  };
  // A second finger while the long-press is still pending means scroll/zoom
  // intent — bail before the timer turns a pinch into a drag. An active drag
  // is kept: the pane's touch-action lock already stops the extra finger.
  const extraPointer = ev => {
    if (session.isTouch && session.phase === 'pending' && ev.pointerId !== session.ptr) {
      finish({ type: 'noop' });
    }
  };
  const key = ev => {
    if (ev.key === 'Escape') finish({ type: 'noop' });
  };
  const bail = () => finish({ type: 'noop' });

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('pointerdown', extraPointer);
  window.addEventListener('keydown', key);
  window.addEventListener('blur', bail);
  if (isTouch) {
    session.tmr = setTimeout(activate, TOUCH_LONG_PRESS_MS);
  }

  return { cleanup: () => finish({ type: 'noop' }) };
}
