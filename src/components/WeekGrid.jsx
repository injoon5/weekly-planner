import { useEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { beginPointerGesture } from '../grid/drag.js';
import { classifyGridPointerDown } from '../grid/grid-gesture.js';
import {
  gridGeometryStyle,
  mergeDragView,
  packView,
  scrollPaneToNow,
  syncHeadTrack,
} from '../grid/grid-layout.js';
import { compactLayout, layout } from '../styles/tokens.stylex.js';
import { grid } from '../styles/grid.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { GridCursors } from './GridCursors.jsx';
import { RefreshBanner } from './RefreshBanner.jsx';
import { WeekGridCanvas } from './WeekGridCanvas.jsx';
import { WeekGridGutter } from './WeekGridGutter.jsx';
import { WeekGridHeader } from './WeekGridHeader.jsx';

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

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const [drag, setDrag] = useState(null);

  const view = useMemo(() => mergeDragView(events, drag), [events, drag]);
  const packed = useMemo(() => packView(view, drag), [view, drag]);

  const dayIndex = useMemo(() => {
    const map = new Map();
    days.forEach((d, i) => map.set(d, i));
    return map;
  }, [days]);

  const dayCount = days.length;

  useEffect(() => {
    dayColRefs.current.length = dayCount;
  }, [dayCount]);

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

      <WeekGridHeader
        headClipRef={headClipRef}
        headTrackRef={headTrackRef}
        headColTemplate={headColTemplate}
        dayColTemplate={dayColTemplate}
        days={days}
        nowDay={nowDay}
      />

      <div {...stylex.props(grid.bodyPane)} ref={paneRef}>
        <div {...stylex.props(grid.sheet)}>
          <div
            {...stylex.props(grid.body, compact && compactLayout)}
            ref={bodyRef}
            style={bodyStyle}
            role="grid"
            aria-readonly={readOnly || undefined}
            onPointerDown={onPointerDown}
            onClick={
              readOnly
                ? (e) => {
                    const blk = e.target.closest('[data-ev]');
                    if (blk) onOpenEdit(blk.dataset.ev);
                  }
                : undefined
            }
            onContextMenu={(e) => {
              if (gestureRef.current) e.preventDefault();
            }}
          >
            <WeekGridGutter gutRef={gutRef} />
            <WeekGridCanvas
              days={days}
              dayColRefs={dayColRefs}
              dayIndex={dayIndex}
              dayCount={dayCount}
              view={view}
              packed={packed}
              drag={drag}
              editing={editing}
              nowMin={nowMin}
              nowDay={nowDay}
              showMemos={showMemos}
              printShowMemos={printShowMemos}
              colorLabel={colorLabel}
              readOnly={readOnly}
              onOpenEdit={onOpenEdit}
            />
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
          <span {...stylex.props(ui.hintFine)}>
            빈 칸을 클릭하거나 드래그해 일정을 만들어요
          </span>
          <span {...stylex.props(ui.hintCoarse)}>빈 칸을 탭해 일정을 추가해요</span>
        </div>
      )}
    </main>
  );
}
