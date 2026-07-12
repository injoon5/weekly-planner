import { useEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { DAYS_KO, DAYS_EN, SLOTS, SLOT_MIN } from '../config.js';
import { beginPointerGesture } from '../drag.js';
import {
  COMPACT_SLOT,
  chipStyle,
  geoX,
  mergeDragView,
  nowLineStyle,
  packView,
  scrollPaneToNow,
  slotHeight,
  slotTop,
  slotUnit as slotUnitCss,
} from '../grid-layout.js';
import { pickLeastUsedColor } from '../models.js';
import { clamp, fmt } from '../time.js';
import { layout } from '../tokens.stylex.js';
import { grid } from '../styles/grid.js';
import { planner } from '../styles/planner.js';

function Block({
  ev,
  isDrag,
  isSel,
  p,
  showMemos,
  colorLabel,
  onKeyDown,
  readOnly,
  dayCount,
  visualDay,
  compact,
}) {
  const [hov, setHov] = useState(false);
  const x = geoX(visualDay, p.col, p.cols, dayCount);
  const isXs = ev.dur <= SLOT_MIN;
  const isTall = ev.dur >= SLOT_MIN * 3;
  const isXl = ev.dur >= SLOT_MIN * 4;
  const showHandles = !readOnly && (hov || isDrag);
  const label = colorLabel ? colorLabel(ev.color) : '';

  return (
    <div
      {...stylex.props(grid.blk, isSel && grid.blkSel, isDrag && grid.blkLift, isXs && grid.blkXs)}
      style={{
        top: slotTop(ev.start, compact),
        height: slotHeight(ev.dur, compact),
        left: x.left,
        width: x.width,
      }}
      data-ev={ev.id}
      data-color={ev.color || 'graphite'}
      role="button"
      tabIndex={0}
      aria-label={
        (ev.title || '일정') +
        (label ? ', ' + label : '') +
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
      {showMemos && ev.dur >= SLOT_MIN * 2 && ev.memo && (
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
  readOnly = false,
  days = [0, 1, 2, 3, 4, 5, 6],
  compact = false,
  showMemos = true,
  colorLabel,
  swapping = false,
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

  const dayIndex = useMemo(() => {
    const map = new Map();
    days.forEach((d, i) => map.set(d, i));
    return map;
  }, [days]);

  const dayCount = days.length;
  const colTemplate = `${layout.gutW} repeat(${dayCount}, minmax(${layout.colMin}, 1fr))`;
  const unit = slotUnitCss(compact);
  const compactBodyH = compact ? { height: `calc(${COMPACT_SLOT} * 48)` } : undefined;

  useEffect(() => {
    const visualCol = days.indexOf(nowDay);
    if (visualCol < 0) return;
    scrollPaneToNow(
      paneRef.current,
      bodyRef.current,
      gutRef.current,
      nowMin,
      visualCol,
      dayCount,
    );
    // Intentional: only re-scroll when switching boards, not every now tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const onPointerDown = (e) => {
    if (readOnly || gestureBlocked || gestureRef.current || e.button > 0) return;
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
      days,
      onDraft: setDrag,
      onResult: (result) => {
        gestureRef.current = null;
        setDrag(null);
        onGestureResult(result);
      },
    });
  };

  return (
    <main
      {...stylex.props(grid.pane, planner.gridSwap, swapping && planner.gridSwapOut)}
      ref={paneRef}
    >
      <div {...stylex.props(grid.sheet)}>
        <div
          {...stylex.props(grid.hrow)}
          ref={hrowRef}
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div {...stylex.props(grid.corner)}>시간</div>
          {days.map((d, i) => (
            <div key={d} {...stylex.props(grid.dcell, i === 0 && grid.dcellFirst)}>
              <span
                {...stylex.props(
                  grid.dko,
                  d === 0 && grid.dkoSun,
                  d === 6 && grid.dkoSat,
                  d === todayDow && grid.dkoToday,
                )}
              >
                {DAYS_KO[d]}
              </span>
              <span {...stylex.props(grid.den)}>{DAYS_EN[d]}</span>
            </div>
          ))}
        </div>

        <div
          {...stylex.props(grid.body)}
          ref={bodyRef}
          style={{ gridTemplateColumns: colTemplate }}
          onPointerDown={onPointerDown}
          onClick={(e) => {
            if (!readOnly) return;
            const blk = e.target.closest('[data-ev]');
            if (blk) onOpenEdit(blk.dataset.ev);
          }}
          onContextMenu={(e) => {
            if (gestureRef.current) e.preventDefault();
          }}
        >
          <div {...stylex.props(grid.gutter)} ref={gutRef} style={compactBodyH}>
            {Array.from({ length: 23 }, (_, k) => {
              const h = k + 1;
              const m = h * 60;
              return (
                <div
                  key={h}
                  {...stylex.props(grid.glab)}
                  style={{ top: `calc(${unit} * ${h * 2})` }}
                >
                  {fmt(m)}
                  {m >= 1080 && <i {...stylex.props(grid.glabSup)}>+1</i>}
                </div>
              );
            })}
          </div>

          {days.map((d, i) => (
            <div
              key={d}
              {...stylex.props(grid.col, i === 0 && grid.colFirst)}
              data-day={d}
              style={compactBodyH}
            >
              {Array.from({ length: SLOTS }, (_, si) => (
                <div
                  key={si}
                  {...stylex.props(grid.slot)}
                  style={{
                    top: `calc(${unit} * ${si})`,
                    ...(compact ? { height: COMPACT_SLOT } : null),
                  }}
                />
              ))}
            </div>
          ))}

          <div {...stylex.props(grid.layer)}>
            {view.map((ev) => {
              if (!dayIndex.has(ev.day)) return null;
              const visualDay = dayIndex.get(ev.day);
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
                  showMemos={showMemos}
                  colorLabel={colorLabel}
                  readOnly={readOnly}
                  dayCount={dayCount}
                  visualDay={visualDay}
                  compact={compact}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenEdit(ev.id);
                    } else if (!readOnly && (e.key === 'Delete' || e.key === 'Backspace')) {
                      e.preventDefault();
                      onOpenEdit(ev.id);
                    }
                  }}
                />
              );
            })}

            {drag && drag.kind === 'new' && dayIndex.has(drag.day) && (() => {
              const x = geoX(dayIndex.get(drag.day), 0, 1, dayCount);
              return (
                <div
                  {...stylex.props(grid.blk, grid.blkGhost)}
                  data-color={drag.color || 'graphite'}
                  style={{
                    top: slotTop(drag.start, compact),
                    height: slotHeight(drag.dur, compact),
                    left: x.left,
                    width: x.width,
                  }}
                >
                  <div {...stylex.props(grid.bt)}>새 일정</div>
                </div>
              );
            })()}

            {drag && dayIndex.has(drag.day) && (
              <div
                {...stylex.props(grid.chip)}
                style={chipStyle(
                  { ...drag, visualCol: dayIndex.get(drag.day) },
                  dayCount,
                  compact,
                )}
              >
                {fmt(drag.start)} – {fmt(drag.start + drag.dur)}
              </div>
            )}

            {dayIndex.has(nowDay) && (
              <div
                {...stylex.props(grid.nowLine)}
                style={nowLineStyle(nowMin, dayIndex.get(nowDay), dayCount, compact)}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
