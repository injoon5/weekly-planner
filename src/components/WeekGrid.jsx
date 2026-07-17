import { useEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  DAYS_KO,
  DAYS_EN,
  NEXT_DAY_START_MIN,
  SLOTS,
  SLOT_MIN,
} from '../lib/config.js';
import { beginPointerGesture } from '../grid/drag.js';
import { classifyGridPointerDown } from '../grid/grid-gesture.js';
import {
  chipStyle,
  geoX,
  gridGeometryStyle,
  mergeDragView,
  nowLineStyle,
  packView,
  scrollPaneToNow,
  slotHeight,
  slotTop,
  syncHeadTrack,
} from '../grid/grid-layout.js';
import { fmt } from '../lib/time.js';
import { compactLayout, layout } from '../styles/tokens.stylex.js';
import { grid } from '../styles/grid.js';
import { planner } from '../styles/planner.js';
import { GridCursors } from './GridCursors.jsx';
import { GridEventBlock } from './GridEventBlock.jsx';
import { RefreshBanner } from './RefreshBanner.jsx';

export function WeekGrid({
  boardId,
  events,
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
  printShowMemos = true,
  colorLabel,
  swapping = false,
  presenceRoom = null,
  presenceColor,
}) {
  const paneRef = useRef(null);
  const bodyRef = useRef(null);
  const gutRef = useRef(null);
  const headClipRef = useRef(null);
  const headTrackRef = useRef(null);
  const dayColRefs = useRef([]);
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
  dayColRefs.current.length = dayCount;
  const colTemplate = `${layout.gutW} repeat(${dayCount}, minmax(${layout.colMin}, 1fr))`;
  const headColTemplate = `${layout.gutW} minmax(0, 1fr)`;
  const dayColTemplate = `repeat(${dayCount}, minmax(${layout.colMin}, 1fr))`;
  const bodyStyle = {
    ...gridGeometryStyle(),
    gridTemplateColumns: colTemplate,
  };

  useEffect(() => {
    const pane = paneRef.current;
    const body = bodyRef.current;
    const track = headTrackRef.current;
    const gut = gutRef.current;
    if (!pane || !body || !track) return;

    const sync = () => {
      syncHeadTrack(pane, body, gut, track, dayColRefs.current);
    };

    const ro = new ResizeObserver(sync);
    ro.observe(pane);
    ro.observe(body);
    if (gut) ro.observe(gut);

    pane.addEventListener('scroll', sync, { passive: true });
    sync();
    return () => {
      ro.disconnect();
      pane.removeEventListener('scroll', sync);
    };
  }, [boardId, dayCount, colTemplate]);

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
    const classified = classifyGridPointerDown({
      target: e.target,
      clientX: e.clientX,
      clientY: e.clientY,
      events: eventsRef.current,
      days,
      bodyEl: bodyRef.current,
      gutEl: gutRef.current,
    });
    if (!classified) return;

    gestureRef.current = beginPointerGesture(e, {
      mode: classified.mode,
      payload: classified.payload,
      bodyEl: bodyRef.current,
      gutEl: gutRef.current,
      hrowEl: headClipRef.current,
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
    >
      <RefreshBanner />

      <div
        {...stylex.props(grid.headClip)}
        ref={headClipRef}
        style={{ gridTemplateColumns: headColTemplate }}
      >
        <div {...stylex.props(grid.corner)}>시간</div>
        <div {...stylex.props(grid.headMask)}>
          <div
            {...stylex.props(grid.headTrack)}
            ref={headTrackRef}
            data-head-track=""
            style={{ gridTemplateColumns: dayColTemplate }}
          >
            {days.map((d, i) => (
              <div key={d} {...stylex.props(grid.dcell, i === 0 && grid.dcellFirst)}>
                <span
                  {...stylex.props(
                    grid.dko,
                    d === 0 && grid.dkoSun,
                    d === 6 && grid.dkoSat,
                    d === nowDay && grid.dkoToday,
                  )}
                >
                  {DAYS_KO[d]}
                </span>
                <span {...stylex.props(grid.den)}>{DAYS_EN[d]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div {...stylex.props(grid.bodyPane)} ref={paneRef}>
        <div {...stylex.props(grid.sheet)}>
          <div
            {...stylex.props(grid.body, compact && compactLayout)}
            ref={bodyRef}
            style={bodyStyle}
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
          <div {...stylex.props(grid.gutter)} ref={gutRef}>
            {Array.from({ length: 23 }, (_, k) => {
              const h = k + 1;
              const m = h * 60;
              const isNextDay = m >= NEXT_DAY_START_MIN;
              return (
                <div
                  key={h}
                  {...stylex.props(grid.glab)}
                  style={{ top: slotTop(m) }}
                >
                  <span
                    {...stylex.props(
                      grid.glabInner,
                      isNextDay && grid.glabInnerNext,
                    )}
                  >
                    {fmt(m)}
                    {isNextDay && <i {...stylex.props(grid.glabSup)}>+1</i>}
                  </span>
                </div>
              );
            })}
          </div>

          {days.map((d, i) => (
            <div
              key={d}
              ref={(el) => {
                dayColRefs.current[i] = el;
              }}
              {...stylex.props(grid.col, i === 0 && grid.colFirst)}
              data-day={d}
            >
              {Array.from({ length: SLOTS }, (_, si) => (
                <div
                  key={si}
                  {...stylex.props(grid.slot)}
                  style={{ top: slotTop(si * SLOT_MIN) }}
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
                <GridEventBlock
                  key={ev.id}
                  ev={ev}
                  isDrag={isDrag}
                  isSel={isSel}
                  p={p}
                  showMemos={showMemos}
                  printShowMemos={printShowMemos}
                  colorLabel={colorLabel}
                  readOnly={readOnly}
                  dayCount={dayCount}
                  visualDay={visualDay}
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

            {drag && dayIndex.has(drag.day) && (
              <div
                {...stylex.props(grid.chip)}
                style={chipStyle(
                  { ...drag, visualCol: dayIndex.get(drag.day) },
                  dayCount,
                )}
              >
                {fmt(drag.start)} – {fmt(drag.start + drag.dur)}
              </div>
            )}

            {dayIndex.has(nowDay) && (
              <div
                {...stylex.props(grid.nowLine)}
                style={nowLineStyle(nowMin, dayIndex.get(nowDay), dayCount)}
              />
            )}
          </div>

          {presenceRoom && (
            <GridCursors
              room={presenceRoom}
              userCursorColor={presenceColor}
              paneRef={paneRef}
            />
          )}
        </div>
        </div>
      </div>

      {!readOnly && events.length === 0 && !drag && (
        <div {...stylex.props(grid.emptyHint)} aria-hidden>
          <span {...stylex.props(grid.emptyHintFine)}>
            빈 칸을 클릭하거나 드래그해 일정을 만들어요
          </span>
          <span {...stylex.props(grid.emptyHintCoarse)}>빈 칸을 탭해 일정을 추가해요</span>
        </div>
      )}
    </main>
  );
}
