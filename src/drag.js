import { clamp, SLOT_MIN, SLOTS } from './time.js';

/**
 * Pure draft math for calendar gestures.
 * DOM capture / listeners stay in the caller; this only maps pointer → draft / commit.
 */

export function locatePointer(point, bodyRect, gutWidth) {
  const colW = (bodyRect.width - gutWidth) / 7;
  const slotH = bodyRect.height / SLOTS;
  return {
    slotF: (point.y - bodyRect.top) / slotH,
    day: clamp(Math.floor((point.x - bodyRect.left - gutWidth) / colW), 0, 6),
  };
}

function sameDraft(a, b) {
  return a && b && a.day === b.day && a.start === b.start && a.dur === b.dur && a.kind === b.kind && a.id === b.id;
}

export function draftFromGesture(session, point, bodyRect, gutWidth) {
  const l = locatePointer(point, bodyRect, gutWidth);

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
    const day = clamp(l.day - session.offDay, 0, 6);
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
  const l = locatePointer(point, bodyRect, gutWidth);
  return {
    ...session,
    offSlot: Math.floor(l.slotF) - session.payload.ev.start / SLOT_MIN,
    offDay: l.day - session.payload.ev.day,
  };
}

export function resolvePendingTap(session) {
  if (session.mode === 'create') {
    const start = Math.min(session.payload.anchor * SLOT_MIN, 1440 - 60);
    return {
      type: 'open-create',
      draft: {
        day: session.payload.day,
        start,
        dur: 60,
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
  onDraft,
  onResult,
}) {
  const isTouch = e.pointerType !== 'mouse';
  let session = {
    mode,
    payload,
    isTouch,
    ptr: e.pointerId,
    phase: 'pending',
    x0: e.clientX,
    y0: e.clientY,
    last: { x: e.clientX, y: e.clientY },
    draft: null,
    offSlot: 0,
    offDay: 0,
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

  const cleanup = () => {
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
  };

  const move = ev => {
    if (ev.pointerId !== session.ptr) return;
    session.last = { x: ev.clientX, y: ev.clientY };
    if (session.phase === 'pending') {
      const d = Math.hypot(ev.clientX - session.x0, ev.clientY - session.y0);
      if (session.isTouch) {
        if (d > 10) cleanup();
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
      onResult(resolvePendingTap(session));
      cleanup();
      return;
    }
    onResult(resolveActiveUp(session));
    cleanup();
  };

  const cancel = ev => {
    if (ev.pointerId === session.ptr) cleanup();
  };
  const key = ev => {
    if (ev.key === 'Escape') cleanup();
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('keydown', key);
  if (isTouch) {
    document.addEventListener('touchmove', blockScroll, { passive: false });
    session.tmr = setTimeout(activate, 300);
  }

  return { cleanup };
}
