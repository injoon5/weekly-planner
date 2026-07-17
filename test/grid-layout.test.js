import { describe, expect, it, vi } from 'vitest';
import { NEXT_DAY_START_SLOT, SLOTS, SLOT_MIN } from '../src/config.js';

vi.mock('../src/tokens.stylex.js', () => ({
  layout: {
    gutW: '54px',
    slotH: '28px',
  },
}));

import {
  chipStyle,
  clampPaneScroll,
  geoX,
  gridGeometryStyle,
  mergeDragView,
  nowLineStyle,
  packView,
  scrollPaneToNow,
  slotHeight,
  slotTop,
  syncHeadTrack,
} from '../src/grid-layout.js';
import { layout } from '../src/tokens.stylex.js';

describe('grid geometry', () => {
  it('builds deterministic column geometry', () => {
    expect(geoX(1, 0, 1, 5)).toEqual({
      left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * 0.200000 + 2px)`,
      width: `calc((100% - ${layout.gutW}) * 0.200000 - 4px)`,
    });
    expect(geoX(0, 1, 2, 0).width).toBe(
      `calc((100% - ${layout.gutW}) * 0.071429 - 4px)`,
    );
  });

  it('maps all vertical geometry through one slot-height contract', () => {
    expect(slotTop(60)).toBe(`calc(${layout.slotH} * 2)`);
    expect(slotHeight(90)).toBe(`calc(${layout.slotH} * 3 - 2px)`);
    expect(nowLineStyle(75, 2, 5)).toEqual({
      top: `calc(${layout.slotH} * 2.5000 - 1px)`,
      left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * 0.400000)`,
      width: `calc((100% - ${layout.gutW}) / 5)`,
    });
    expect(gridGeometryStyle()).toEqual({
      '--grid-body-height': `calc(${layout.slotH} * ${SLOTS})`,
      '--grid-hour-height': `calc(${layout.slotH} * ${60 / SLOT_MIN})`,
      '--grid-next-day-top': `calc(${layout.slotH} * ${NEXT_DAY_START_SLOT})`,
    });
  });

  it('places drag chips above or below the pointer area', () => {
    expect(chipStyle({ visualCol: 2, start: 60, dur: 30 }, 5)).toEqual({
      left: `calc(${layout.gutW} + (100% - ${layout.gutW}) * 0.400000 + 6px)`,
      top: `calc(${layout.slotH} * 2 - 29px)`,
    });
    expect(chipStyle({ visualCol: 0, start: 0, dur: 30 }, 7).top).toBe(
      `calc(${layout.slotH} * 1 + 8px)`,
    );
  });
});

describe('grid event views', () => {
  it('merges only the actively dragged event', () => {
    const events = [
      { id: 'a', day: 1, start: 30, dur: 60 },
      { id: 'b', day: 2, start: 90, dur: 30 },
    ];

    const view = mergeDragView(events, {
      kind: 'ev',
      id: 'a',
      day: 4,
      start: 120,
      dur: 90,
    });

    expect(view).toEqual([
      { id: 'a', day: 4, start: 120, dur: 90 },
      events[1],
    ]);
    expect(events[0]).toEqual({ id: 'a', day: 1, start: 30, dur: 60 });
  });

  it('packs each day while excluding the dragged event', () => {
    const packed = packView(
      [
        { id: 'a', day: 1, start: 0, dur: 60 },
        { id: 'b', day: 1, start: 30, dur: 60 },
        { id: 'c', day: 2, start: 0, dur: 30 },
      ],
      { kind: 'ev', id: 'b' },
    );

    expect(Object.fromEntries(packed)).toEqual({
      a: { col: 0, cols: 1 },
      c: { col: 0, cols: 1 },
    });
  });

  it('scrolls now into view and reveals its visual column', () => {
    const pane = {
      scrollTop: 0,
      scrollLeft: 0,
      scrollWidth: 1200,
      clientWidth: 400,
    };
    const body = {
      offsetWidth: 1050,
      getBoundingClientRect: () => ({ height: 1440 }),
    };
    const gut = { offsetWidth: 50 };

    scrollPaneToNow(pane, body, gut, 600, 3, 5);

    expect(pane.scrollTop).toBe(450);
    expect(pane.scrollLeft).toBe(590);
  });

  it('resets horizontal scroll when the grid fits the pane', () => {
    const pane = {
      scrollTop: 0,
      scrollLeft: 120,
      scrollWidth: 390,
      clientWidth: 390,
    };
    const body = {
      offsetWidth: 390,
      getBoundingClientRect: () => ({ height: 1440 }),
    };
    const gut = { offsetWidth: 46 };

    scrollPaneToNow(pane, body, gut, 600, 3, 7);

    expect(pane.scrollTop).toBe(450);
    expect(pane.scrollLeft).toBe(0);
  });

  it('clamps scroll offsets to content bounds', () => {
    const pane = {
      scrollTop: -20,
      scrollLeft: 500,
      scrollWidth: 800,
      scrollHeight: 1200,
      clientWidth: 400,
      clientHeight: 600,
    };

    clampPaneScroll(pane);

    expect(pane.scrollTop).toBe(0);
    expect(pane.scrollLeft).toBe(400);
  });

  it('syncs header track width and transform to day columns', () => {
    const pane = {
      scrollLeft: 120,
      scrollWidth: 900,
      clientWidth: 360,
    };
    const body = { offsetWidth: 700 };
    const gut = { offsetWidth: 46 };
    const track = { style: cssVarStyle() };
    const dayCols = [
      { offsetLeft: 46, offsetWidth: 80 },
      { offsetLeft: 126, offsetWidth: 80 },
      { offsetLeft: 206, offsetWidth: 80 },
      { offsetLeft: 286, offsetWidth: 80 },
      { offsetLeft: 366, offsetWidth: 80 },
      { offsetLeft: 446, offsetWidth: 80 },
      { offsetLeft: 526, offsetWidth: 80 },
    ];

    syncHeadTrack(pane, body, gut, track, dayCols);

    expect(track.style.getPropertyValue('--head-day-width')).toBe('560px');
    expect(track.style.getPropertyValue('--head-scroll-x')).toBe('-120px');
  });

  it('does not mutate scroll offsets while syncing (iOS rubber-band safe)', () => {
    const pane = {
      scrollLeft: -24,
      scrollWidth: 900,
      clientWidth: 360,
    };
    const body = { offsetWidth: 700 };
    const gut = { offsetWidth: 46 };
    const track = { style: cssVarStyle() };

    syncHeadTrack(pane, body, gut, track, []);

    expect(pane.scrollLeft).toBe(-24);
    expect(track.style.getPropertyValue('--head-scroll-x')).toBe('-0px');
  });

  it('clamps header transform when scroll overshoots the far edge', () => {
    const pane = {
      scrollLeft: 620,
      scrollWidth: 900,
      clientWidth: 360,
    };
    const track = { style: cssVarStyle() };

    syncHeadTrack(pane, { offsetWidth: 700 }, { offsetWidth: 46 }, track, []);

    expect(pane.scrollLeft).toBe(620);
    expect(track.style.getPropertyValue('--head-scroll-x')).toBe('-540px');
  });
});

/** Minimal CSSStyleDeclaration stand-in for custom property writes. */
function cssVarStyle() {
  const props = Object.create(null);
  return {
    setProperty(name, value) {
      props[name] = String(value);
    },
    getPropertyValue(name) {
      return props[name] ?? '';
    },
  };
}
