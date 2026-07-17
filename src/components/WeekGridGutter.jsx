import * as stylex from '@stylexjs/stylex';
import { NEXT_DAY_START_MIN } from '../lib/config.js';
import { slotTop } from '../grid/grid-layout.js';
import { fmt } from '../lib/time.js';
import { grid } from '../styles/grid.js';
import { ui } from '../styles/ui.js';

/** Hour labels in the left gutter (01:00–23:00, with +1 after midnight). */
export function WeekGridGutter({ gutRef }) {
  return (
    <div {...stylex.props(grid.gutter, ui.glassOpaque)} ref={gutRef}>
      {Array.from({ length: 23 }, (_, k) => {
        const h = k + 1;
        const m = h * 60;
        const isNextDay = m >= NEXT_DAY_START_MIN;
        return (
          <div key={h} {...stylex.props(grid.glab)} style={{ top: slotTop(m) }}>
            <span {...stylex.props(grid.glabInner, isNextDay && grid.glabInnerNext)}>
              {fmt(m)}
              {isNextDay && <i {...stylex.props(grid.glabSup)}>+1</i>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
