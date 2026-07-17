import { useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { SLOTS, SLOT_MIN } from '../lib/config.js';
import {
  chipStyle,
  geoX,
  nowLineStyle,
  slotHeight,
  slotTop,
} from '../grid/grid-layout.js';
import { fmt } from '../lib/time.js';
import { grid } from '../styles/grid.js';
import { GridEventBlock } from './GridEventBlock.jsx';

/** One hover highlight per day — replaces 48 slot nodes × N days. */
function DayColumn({ day, colRef, first }) {
  const [hoverTop, setHoverTop] = useState(null);
  const hoverSlot = useRef(-1);

  return (
    <div
      ref={colRef}
      {...stylex.props(grid.col, first && grid.colFirst)}
      data-day={day}
      onPointerMove={(e) => {
        if (e.pointerType === 'touch') return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.height <= 0) return;
        const y = e.clientY - rect.top;
        const si = Math.max(0, Math.min(SLOTS - 1, Math.floor((y / rect.height) * SLOTS)));
        if (si === hoverSlot.current) return;
        hoverSlot.current = si;
        setHoverTop(slotTop(si * SLOT_MIN));
      }}
      onPointerLeave={() => {
        hoverSlot.current = -1;
        setHoverTop(null);
      }}
    >
      {hoverTop != null && (
        <div {...stylex.props(grid.slotHover)} style={{ top: hoverTop }} aria-hidden="true" />
      )}
    </div>
  );
}

/** Day columns + overlay layer (events, drag ghost, now line). */
export function WeekGridCanvas({
  days,
  dayColRefs,
  dayIndex,
  dayCount,
  view,
  packed,
  drag,
  editing,
  nowMin,
  nowDay,
  showMemos,
  printShowMemos,
  colorLabel,
  readOnly,
  onOpenEdit,
}) {
  return (
    <>
      {days.map((d, i) => (
        <DayColumn
          key={d}
          day={d}
          first={i === 0}
          colRef={(el) => {
            dayColRefs.current[i] = el;
          }}
        />
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
    </>
  );
}
