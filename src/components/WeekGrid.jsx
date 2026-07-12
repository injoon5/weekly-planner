import { useEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { DAYS_KO, DAYS_EN, SLOTS, SLOT_MIN } from '../config.js';
import { beginPointerGesture } from '../drag.js';
import {
  chipStyle,
  geoX,
  mergeDragView,
  nowLineStyle,
  packView,
  scrollPaneToNow,
  slotHeight,
  slotTop,
} from '../grid-layout.js';
import { pickLeastUsedColor } from '../models.js';
import { clamp, fmt } from '../time.js';
import { layout } from '../tokens.stylex.js';
import { grid } from '../styles/grid.js';

function Block({ ev, isDrag, isSel, p, onKeyDown }) {
  const [hov, setHov] = useState(false);
  const x = geoX(ev.day, p.col, p.cols);
  const isXs = ev.dur <= SLOT_MIN;
  const isTall = ev.dur >= SLOT_MIN * 3;
  const isXl = ev.dur >= SLOT_MIN * 4;
  const showHandles = hov || isDrag;

  return (
    <div
      {...stylex.props(grid.blk, isSel && grid.blkSel, isDrag && grid.blkLift, isXs && grid.blkXs)}
      style={{
        top: slotTop(ev.start),
        height: slotHeight(ev.dur),
        left: x.left,
        width: x.width,
      }}
      data-ev={ev.id}
      data-color={ev.color || 'graphite'}
      role="button"
      tabIndex={0}
      aria-label={
        (ev.title || '일정') +
        ', ' +
        DAYS_KO[ev.day] +
        '요일 ' +
        fmt(ev.start) +
        '부터 ' +
        fmt(ev.start + ev.dur) +
        '까지'
      }
      onPointerEnter={() => setHov(true)}
      onPointerLeave={() => setHov(false)}
      onKeyDown={onKeyDown}
    >
      <div data-hh="t" {...stylex.props(grid.hh, grid.hhTop, showHandles && !isXs && grid.hhVisible)} />
      <div {...stylex.props(grid.bt, isTall && grid.btTall)}>{ev.title || '일정'}</div>
      {ev.dur >= SLOT_MIN * 2 && (
        <div {...stylex.props(grid.bm)}>
          {fmt(ev.start)} – {fmt(ev.start + ev.dur)}
        </div>
      )}
      {ev.dur >= SLOT_MIN * 2 && ev.memo && (
        <div {...stylex.props(grid.bn, isXl && grid.bnXl)}>{ev.memo}</div>
      )}
      <div data-hh="b" {...stylex.props(grid.hh, grid.hhBot, showHandles && !isXs && grid.hhVisible)} />
    </div>
  );
}

export function WeekGrid({
  boardId,
  events,
  todayDow,
  nowMin,
  nowDay,
  editing,
  onOpenEdit,
  onGestureResult,
  gestureBlocked,
}) {
  const paneRef = useRef(null);
  const bodyRef = useRef(null);
  const gutRef = useRef(null);
  const hrowRef = useRef(null);
  const gestureRef = useRef(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const [drag, setDrag] = useState(null);

  const view = useMemo(() => mergeDragView(events, drag), [events, drag]);
  const packed = useMemo(() => packView(view, drag), [view, drag]);

  useEffect(() => {
    scrollPaneToNow(paneRef.current, bodyRef.current, gutRef.current, nowMin, nowDay);
  }, [boardId]);

  const onPointerDown = (e) => {
    if (gestureBlocked || gestureRef.current || e.button > 0) return;
    const blkEl = e.target.closest('[data-ev]');
    let mode;
    let payload;

    if (blkEl) {
      const ev = eventsRef.current.find((x) => x.id === blkEl.dataset.ev);
      if (!ev) return;
      mode =
        e.target.dataset.hh === 't' || e.target.closest('[data-hh="t"]')
          ? 'resize-top'
          : e.target.dataset.hh === 'b' || e.target.closest('[data-hh="b"]')
            ? 'resize-bot'
            : 'move';
      payload = { ev: { ...ev } };
    } else {
      const col = e.target.closest('[data-day]');
      if (!col) return;
      const body = bodyRef.current.getBoundingClientRect();
      const slotH = body.height / SLOTS;
      const slotF = (e.clientY - body.top) / slotH;
      mode = 'create';
      payload = {
        day: +col.dataset.day,
        anchor: clamp(Math.floor(slotF), 0, SLOTS - 1),
        color: pickLeastUsedColor(eventsRef.current),
      };
    }

    gestureRef.current = beginPointerGesture(e, {
      mode,
      payload,
      bodyEl: bodyRef.current,
      gutEl: gutRef.current,
      hrowEl: hrowRef.current,
      paneEl: paneRef.current,
      onDraft: setDrag,
      onResult: (result) => {
        gestureRef.current = null;
        setDrag(null);
        onGestureResult(result);
      },
    });
  };

  return (
    <main {...stylex.props(grid.pane)} ref={paneRef}>
      <div {...stylex.props(grid.sheet)}>
        <div {...stylex.props(grid.hrow)} ref={hrowRef}>
          <div {...stylex.props(grid.corner)}>시간</div>
          {DAYS_KO.map((k, d) => (
            <div key={d} {...stylex.props(grid.dcell, d === 0 && grid.dcellFirst)}>
              <span
                {...stylex.props(
                  grid.dko,
                  d === 0 && grid.dkoSun,
                  d === 6 && grid.dkoSat,
                  d === todayDow && grid.dkoToday,
                )}
              >
                {k}
              </span>
              <span {...stylex.props(grid.den)}>{DAYS_EN[d]}</span>
            </div>
          ))}
        </div>

        <div
          {...stylex.props(grid.body)}
          ref={bodyRef}
          onPointerDown={onPointerDown}
          onContextMenu={(e) => {
            if (gestureRef.current) e.preventDefault();
          }}
        >
          <div {...stylex.props(grid.gutter)} ref={gutRef}>
            {Array.from({ length: 23 }, (_, k) => {
              const h = k + 1;
              const m = h * 60;
              return (
                <div
                  key={h}
                  {...stylex.props(grid.glab)}
                  style={{ top: `calc(${layout.slotH} * ${h * 2})` }}
                >
                  {fmt(m)}
                  {m >= 1080 && <i {...stylex.props(grid.glabSup)}>+1</i>}
                </div>
              );
            })}
          </div>

          {Array.from({ length: 7 }, (_, d) => (
            <div key={d} {...stylex.props(grid.col, d === 0 && grid.colFirst)} data-day={d}>
              {Array.from({ length: SLOTS }, (_, i) => (
                <div
                  key={i}
                  {...stylex.props(grid.slot)}
                  style={{ top: `calc(${layout.slotH} * ${i})` }}
                />
              ))}
            </div>
          ))}

          <div {...stylex.props(grid.layer)}>
            {view.map((ev) => {
              const isDrag = drag && drag.kind === 'ev' && drag.id === ev.id;
              const p = isDrag ? { col: 0, cols: 1 } : packed.get(ev.id) || { col: 0, cols: 1 };
              const isSel =
                editing && !editing.closing && editing.mode === 'edit' && editing.id === ev.id;
              return (
                <Block
                  key={ev.id}
                  ev={ev}
                  isDrag={isDrag}
                  isSel={isSel}
                  p={p}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenEdit(ev.id);
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                      // Same policy as UI: open editor (hold-to-delete lives there)
                      e.preventDefault();
                      onOpenEdit(ev.id);
                    }
                  }}
                />
              );
            })}

            {drag && drag.kind === 'new' && (() => {
              const x = geoX(drag.day, 0, 1);
              return (
                <div
                  {...stylex.props(grid.blk, grid.blkGhost)}
                  data-color={drag.color || 'graphite'}
                  style={{
                    top: slotTop(drag.start),
                    height: slotHeight(drag.dur),
                    left: x.left,
                    width: x.width,
                  }}
                >
                  <div {...stylex.props(grid.bt)}>새 일정</div>
                </div>
              );
            })()}

            {drag && (
              <div {...stylex.props(grid.chip)} style={chipStyle(drag)}>
                {fmt(drag.start)} – {fmt(drag.start + drag.dur)}
              </div>
            )}

            <div {...stylex.props(grid.nowLine)} style={nowLineStyle(nowMin, nowDay)} />
          </div>
        </div>
      </div>
    </main>
  );
}
