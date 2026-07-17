import * as stylex from '@stylexjs/stylex';
import { fmtRange } from '../lib/time.js';
import { planner } from '../styles/planner.js';

function MetaField({ label, value, blank }) {
  return (
    <span {...stylex.props(planner.printMetaItem)}>
      {label}
      {value ? (
        <b {...stylex.props(planner.printMetaVal)}>{value}</b>
      ) : blank ? (
        <i {...stylex.props(planner.printMetaBlank)} />
      ) : null}
    </span>
  );
}

/** Print-only header fields: name, date range, time — driven by print prefs. */
export function PrintMeta({ prefs }) {
  if (!prefs) return null;

  const dateVal =
    prefs.showDate && (prefs.from || prefs.to) ? fmtRange(prefs.from, prefs.to) : '';
  const dateBlank = prefs.showDate && !dateVal;

  return (
    <div {...stylex.props(planner.printMeta)}>
      {prefs.showName && (
        <MetaField label="이름" value={prefs.name?.trim() || ''} blank={!prefs.name?.trim()} />
      )}
      {prefs.showDate && <MetaField label="날짜" value={dateVal} blank={dateBlank} />}
      {prefs.showTime && (
        <MetaField label="시간" value={prefs.time?.trim() || ''} blank={!prefs.time?.trim()} />
      )}
    </div>
  );
}
