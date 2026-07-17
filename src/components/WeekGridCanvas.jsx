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
    </>
  );
}
