import { clamp, DAY_MIN, SLOT_MIN, SLOTS } from './time.js';

/**
 * Pure draft math for calendar gestures.
 * DOM capture / listeners stay in the caller; this only maps pointer → draft / commit.
 */

const DEFAULT_DAYS = [0, 1, 2, 3, 4, 5, 6];

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

export function edgeScrollDelta(pointer, paneRect, gutWidth, headHeight, margin = 36) {
  const L = paneRect.left + gutWidth + 6;
  const R = paneRect.right - 6;
  const T = paneRect.top + headHeight + 4;
  const B = paneRect.bottom - 6;
  let dx = 0;
  let dy = 0;
  if (pointer.x < L + margin) dx = -Math.ceil(clamp(1 - (pointer.x - L) / margin, 0, 1) * 15);
  else if (pointer.x > R - margin) dx = Math.ceil(clamp(1 - (R - pointer.x) / margin, 0, 1) * 15);
  if (pointer.y < T + margin) dy = -Math.ceil(clamp(1 - (pointer.y - T) / margin, 0, 1) * 15);
  else if (pointer.y > B - margin) dy = Math.ceil(clamp(1 - (B - pointer.y) / margin, 0, 1) * 15);
  return { dx, dy };
}

/**
 * Imperative gesture controller. Owns pointer listeners; reports drafts via callbacks.
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
    offSlot: 0,
    offCol: 0,
    tmr: 0,
    raf: 0,
  };

  const metrics = () => ({
    body: bodyEl.getBoundingClientRect(),
    gut: gutEl.getBoundingClientRect().width,
    pane: paneEl.getBoundingClientRect(),
    head: hrowEl.offsetHeight,
    gutOffset: gutEl.offsetWidth,
  });

  const setDraft = d => {
    if (sameDraft(session.draft, d)) return;
    session.draft = d;
    onDraft(d);
  };

  const apply = point => {
    const m = metrics();
    setDraft(draftFromGesture(session, point, m.body, m.gut));
  };

  const edgeLoop = () => {
    if (session.phase !== 'active') return;
    const m = metrics();
    const { dx, dy } = edgeScrollDelta(session.last, m.pane, m.gutOffset, m.head);
    if (dx || dy) {
      paneEl.scrollBy(dx, dy);
      apply(session.last);
    }
    session.raf = requestAnimationFrame(edgeLoop);
  };

  const activate = () => {
    if (session.phase !== 'pending') return;
    session.phase = 'active';
    clearTimeout(session.tmr);
    try {
      bodyEl.setPointerCapture(session.ptr);
    } catch {
      /* ignore */
    }
    if (session.isTouch && navigator.vibrate) navigator.vibrate(8);
    document.body.classList.add('dragging');
    const m = metrics();
    session = activateOffsets(session, session.last, m.body, m.gut);
    apply(session.last);
    edgeLoop();
  };

  const blockScroll = ev => {
    if (session.phase === 'active') ev.preventDefault();
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
    window.removeEventListener('keydown', key);
    document.removeEventListener('touchmove', blockScroll);
    document.body.classList.remove('dragging');
    onDraft(null);
    onResult(result);
  };

  const move = ev => {
    if (ev.pointerId !== session.ptr) return;
    session.last = { x: ev.clientX, y: ev.clientY };
    if (session.phase === 'pending') {
      const d = Math.hypot(ev.clientX - session.x0, ev.clientY - session.y0);
      if (session.isTouch) {
        if (d > 10) finish({ type: 'noop' });
      } else if (d > 4) {
        activate();
      }
      return;
    }
    apply(session.last);
  };

  const up = ev => {
    if (ev.pointerId !== session.ptr) return;
    if (session.phase === 'pending') {
      finish(resolvePendingTap(session));
      return;
    }
    finish(resolveActiveUp(session));
  };

  const cancel = ev => {
    if (ev.pointerId === session.ptr) finish({ type: 'noop' });
  };
  const key = ev => {
    if (ev.key === 'Escape') finish({ type: 'noop' });
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('keydown', key);
  if (isTouch) {
    document.addEventListener('touchmove', blockScroll, { passive: false });
    session.tmr = setTimeout(activate, 300);
  }

  return { cleanup: () => finish({ type: 'noop' }) };
}
