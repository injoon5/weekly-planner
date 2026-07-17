import * as stylex from '@stylexjs/stylex';
import { DAYS_KO, DAYS_EN } from '../lib/config.js';
import { grid } from '../styles/grid.js';
import { ui } from '../styles/ui.js';

/** Sticky weekday header above the scrollable grid body. */
export function WeekGridHeader({
  headClipRef,
  headTrackRef,
  headColTemplate,
  dayColTemplate,
  days,
  nowDay,
}) {
  return (
    <div
      {...stylex.props(grid.headClip, ui.glassOpaque)}
      ref={headClipRef}
      style={{ gridTemplateColumns: headColTemplate }}
    >
      <div {...stylex.props(grid.corner, ui.glassOpaque)}>시간</div>
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
  );
}
