import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { DAYS_KO, SLOT_MIN } from '../config.js';
import { geoX, slotHeight, slotTop } from '../grid-layout.js';
import { fmt } from '../time.js';
import { grid } from '../styles/grid.js';

export function GridEventBlock({
  ev,
  isDrag,
  isSel,
  p,
  showMemos,
  printShowMemos,
  colorLabel,
  onKeyDown,
  readOnly,
  dayCount,
  visualDay,
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
      <div
        data-hh="t"
        {...stylex.props(
          grid.hh,
          grid.hhTop,
          isXs && grid.hhXs,
          showHandles && grid.hhVisible,
        )}
      />
      <div {...stylex.props(grid.bt, isTall && grid.btTall)}>{ev.title || '일정'}</div>
      {ev.dur >= SLOT_MIN * 2 && (
        <div {...stylex.props(grid.bm)}>
          {fmt(ev.start)} – {fmt(ev.start + ev.dur)}
        </div>
      )}
      {ev.dur >= SLOT_MIN * 2 &&
        ev.memo &&
        (showMemos || printShowMemos) && (
          <div
            {...stylex.props(
              grid.bn,
              isXl && grid.bnXl,
              !showMemos && grid.bnScreenHidden,
              !printShowMemos && grid.bnPrintHidden,
            )}
          >
            {ev.memo}
          </div>
        )}
      <div
        data-hh="b"
        {...stylex.props(
          grid.hh,
          grid.hhBot,
          isXs && grid.hhXs,
          showHandles && grid.hhVisible,
        )}
      />
    </div>
  );
}
