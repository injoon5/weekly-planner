import * as stylex from '@stylexjs/stylex';
import { colors, layout } from '../tokens.stylex.js';

const MOBILE = '@media screen and (max-width: 720px)';
const TPLC = `${layout.gutW} repeat(7, minmax(${layout.colMin}, 1fr))`;
const GRID_BODY_HEIGHT = 'var(--grid-body-height)';
const GRID_HOUR_HEIGHT = 'var(--grid-hour-height)';
const GRID_NEXT_DAY_TOP = 'var(--grid-next-day-top)';

const hintIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translate(-50%, 6px)' },
});

export const grid = stylex.create({
  emptyHint: {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(24px + env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    zIndex: 40,
    padding: '7px 13px',
    borderRadius: '99px',
    backgroundColor: colors.glass,
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 12px rgba(20,20,26,.10)`,
    fontSize: '12px',
    fontWeight: 550,
    letterSpacing: '-0.002em',
    color: colors.muted,
    whiteSpace: 'nowrap',
    maxWidth: 'calc(100vw - 32px)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    pointerEvents: 'none',
    animationName: hintIn,
    animationDuration: '.45s',
    animationDelay: '.5s',
    animationTimingFunction: 'cubic-bezier(.2,0,0,1)',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
    },
    '@media print': {
      display: 'none',
    },
  },

  emptyHintFine: {
    display: 'inline',
    '@media (pointer: coarse)': {
      display: 'none',
    },
  },

  emptyHintCoarse: {
    display: 'none',
    '@media (pointer: coarse)': {
      display: 'inline',
    },
  },

  pane: {
    flex: 1,
    minHeight: 0,
    margin: '0 12px 12px',
    position: 'relative',
    backgroundColor: colors.paper,
    border: `1px solid ${colors.line}`,
    borderRadius: '12px',
    overflow: 'auto',
    overscrollBehavior: 'contain',
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.sb} transparent`,
    [MOBILE]: {
      margin: 0,
      borderRadius: 0,
      borderLeft: 0,
      borderRight: 0,
      borderBottom: 0,
    },
    '@media print': {
      flex: 'none',
      minHeight: 0,
      // Same horizontal start as planner.top title (both 0 inset).
      margin: 0,
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'visible',
      borderRadius: 0,
      borderColor: '#D8D8DD',
    },
  },

  sheet: {
    minWidth: 'max-content',
    width: '100%',
    '@media print': {
      minWidth: 0,
      width: '100%',
    },
  },

  hrow: {
    display: 'grid',
    gridTemplateColumns: TPLC,
    position: 'sticky',
    top: 0,
    zIndex: 30,
    backgroundColor: colors.glass,
    WebkitBackdropFilter: 'blur(10px) saturate(1.5)',
    backdropFilter: 'blur(10px) saturate(1.5)',
    borderBottom: `1px solid ${colors.line}`,
    '@media print': {
      position: 'static',
      backgroundColor: '#fff',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
    '@media (prefers-reduced-transparency: reduce)': {
      backgroundColor: colors.paper,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
  },

  corner: {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: '0 8px 6px',
    fontSize: '9.5px',
    fontWeight: 550,
    color: colors.faint,
    letterSpacing: '0.02em',
    backgroundColor: colors.glass2,
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    borderRight: `1px solid ${colors.line}`,
    '@media print': {
      position: 'static',
      backgroundColor: '#fff',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
    '@media (prefers-reduced-transparency: reduce)': {
      backgroundColor: colors.paper,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
  },

  dcell: {
    height: layout.headH,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderLeft: `1px solid ${colors.line}`,
  },

  dcellFirst: {
    borderLeft: 'none',
  },

  dko: {
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1,
    '@media print': {
      fontSize: '12.5px',
    },
  },

  dkoSun: {
    color: colors.sun,
  },

  dkoSat: {
    color: colors.sat,
  },

  dkoToday: {
    backgroundColor: colors.ink,
    color: colors.onInk,
    width: '22px',
    height: '22px',
    borderRadius: '99px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    '@media print': {
      width: '20px',
      height: '20px',
      fontSize: '11px',
    },
  },

  den: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.faint,
    letterSpacing: '0.012em',
    '@media print': {
      fontSize: '9.5px',
    },
  },

  body: {
    display: 'grid',
    gridTemplateColumns: TPLC,
    position: 'relative',
    height: GRID_BODY_HEIGHT,
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  },

  gutter: {
    position: 'sticky',
    left: 0,
    zIndex: 25,
    height: '100%',
    backgroundColor: colors.glass3,
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    borderRight: `1px solid ${colors.line}`,
    '@media print': {
      position: 'relative',
      left: 'auto',
      backgroundColor: '#fff',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
    '@media (prefers-reduced-transparency: reduce)': {
      backgroundColor: colors.paper,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
  },

  glab: {
    position: 'absolute',
    right: '7px',
    transform: 'translateY(-50%)',
    fontSize: '10px',
    fontWeight: 500,
    lineHeight: 1,
    color: colors.faint,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.012em',
    whiteSpace: 'nowrap',
    '@media print': {
      fontSize: '9.5px',
      right: '5px',
    },
  },

  glabSup: {
    fontStyle: 'normal',
    fontSize: '7.5px',
    fontWeight: 650,
    opacity: 0.75,
    verticalAlign: '3px',
    marginLeft: '2px',
    letterSpacing: 0,
    '@media print': {
      fontSize: '7.5px',
    },
  },

  col: {
    position: 'relative',
    height: '100%',
    cursor: 'cell',
    backgroundImage: `
      repeating-linear-gradient(to bottom, ${colors.gridHour} 0 1px, transparent 1px ${GRID_HOUR_HEIGHT}),
      repeating-linear-gradient(to bottom, transparent 0 ${layout.slotH}, ${colors.gridHalf} ${layout.slotH} calc(${layout.slotH} + 1px), transparent calc(${layout.slotH} + 1px) ${GRID_HOUR_HEIGHT})
    `,
    borderLeft: `1px solid ${colors.line}`,
    '::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      top: GRID_NEXT_DAY_TOP,
      bottom: 0,
      backgroundColor: colors.hov,
      opacity: 0.55,
      borderTop: `1px solid ${colors.edge}`,
      pointerEvents: 'none',
    },
    '@media print': {
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact',
    },
  },

  colFirst: {
    borderLeft: 'none',
  },

  slot: {
    position: 'absolute',
    left: '2px',
    right: '2px',
    height: `calc(${layout.slotH} - 2px)`,
    marginTop: '1px',
    borderRadius: '5px',
    transitionProperty: 'background-color',
    transitionDuration: '.12s',
    transitionTimingFunction: 'ease',
    '@media (hover: hover)': {
      ':hover': {
        backgroundColor: colors.hov,
      },
    },
    '@media print': {
      display: 'none',
    },
  },

  layer: {
    position: 'absolute',
    inset: 0,
    zIndex: 5,
    pointerEvents: 'none',
  },

  blk: {
    position: 'absolute',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--ev-bg)',
    color: 'var(--ev-fg)',
    borderRadius: '6px',
    padding: '4px 7px 4px 11px',
    cursor: 'grab',
    outline: 'none',
    boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--ev-accent) 22%, transparent)',
    transitionProperty: 'top, left, width, height, box-shadow, transform',
    transitionDuration: '.14s, .16s, .16s, .14s, .18s, .18s',
    transitionTimingFunction: 'cubic-bezier(.2,0,0,1)',
    '::before': {
      content: '""',
      position: 'absolute',
      left: '3px',
      top: '3px',
      bottom: '3px',
      width: '3px',
      borderRadius: '99px',
      backgroundColor: 'var(--ev-accent)',
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(--ev-accent) 30%, transparent), 0 0 0 2px ${colors.paper}, 0 0 0 4px var(--ev-accent)`,
      zIndex: 8,
    },
    '@media print': {
      padding: '2px 4px 2px 8px',
      borderRadius: '3px',
      boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--ev-accent) 35%, transparent)',
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact',
      '::before': {
        left: '2px',
        top: '2px',
        bottom: '2px',
        width: '2px',
      },
    },
  },

  blkSel: {
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(--ev-accent) 30%, transparent), 0 0 0 2px ${colors.paper}, 0 0 0 3.5px var(--ev-accent)`,
    zIndex: 8,
  },

  blkLift: {
    cursor: 'grabbing',
    zIndex: 20,
    transform: 'scale(1.02)',
    transitionDuration: '.1s, .12s, .12s, .1s, .18s, .18s',
    boxShadow:
      'inset 0 0 0 1px color-mix(in srgb, var(--ev-accent) 32%, transparent), 0 2px 4px rgba(20,20,26,.10), 0 12px 28px -8px rgba(20,20,26,.35)',
  },

  blkGhost: {
    pointerEvents: 'none',
    zIndex: 19,
    backgroundColor: `color-mix(in srgb, var(--ev-bg) 62%, ${colors.paper})`,
    boxShadow: 'none',
    borderWidth: '1.5px',
    borderStyle: 'dashed',
    borderColor: 'var(--ev-accent)',
    '::before': {
      display: 'none',
    },
  },

  blkXs: {
    padding: '2.5px 7px 2px 11px',
    borderRadius: '5px',
    '::before': {
      top: '2px',
      bottom: '2px',
    },
  },

  bt: {
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: '-0.004em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media print': {
      fontSize: '10.5px',
    },
  },

  btTall: {
    whiteSpace: 'normal',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  bm: {
    marginTop: '1px',
    fontSize: '10px',
    fontWeight: 500,
    opacity: 0.72,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.012em',
    lineHeight: 1.2,
    '@media print': {
      fontSize: '9px',
      marginTop: '1px',
      opacity: 0.85,
    },
  },

  bn: {
    marginTop: '1px',
    fontSize: '10.5px',
    lineHeight: 1.35,
    opacity: 0.62,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media print': {
      fontSize: '8.5px',
      opacity: 0.7,
      whiteSpace: 'normal',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
  },

  bnXl: {
    whiteSpace: 'normal',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  hh: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '8px',
    cursor: 'ns-resize',
    '::after': {
      content: '""',
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '22px',
      height: '3px',
      borderRadius: '99px',
      backgroundColor: 'var(--ev-accent)',
      opacity: 0,
      transitionProperty: 'opacity',
      transitionDuration: '.15s',
      transitionTimingFunction: 'ease',
    },
    '@media (pointer: coarse)': {
      height: '13px',
    },
  },

  hhTop: {
    top: '-2px',
    '::after': {
      top: '3px',
    },
    '@media (pointer: coarse)': {
      top: '-4px',
    },
  },

  hhBot: {
    bottom: '-2px',
    '::after': {
      bottom: '3px',
    },
    '@media (pointer: coarse)': {
      bottom: '-4px',
    },
  },

  hhVisible: {
    '::after': {
      opacity: 0.55,
    },
  },

  hhHidden: {
    '::after': {
      display: 'none',
    },
  },

  chip: {
    position: 'absolute',
    zIndex: 40,
    pointerEvents: 'none',
    backgroundColor: colors.chipBg,
    color: colors.chipFg,
    fontSize: '10.5px',
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '0.02em',
    fontVariantNumeric: 'tabular-nums',
    padding: '5px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    boxShadow: '0 6px 16px -4px rgba(0,0,0,.35)',
    '@media print': {
      display: 'none',
    },
  },

  nowLine: {
    position: 'absolute',
    zIndex: 9,
    height: '2px',
    borderRadius: '2px',
    backgroundColor: colors.now,
    boxShadow: `0 0 0 1px ${colors.nowHalo}`,
    pointerEvents: 'none',
    '::before': {
      content: '""',
      position: 'absolute',
      left: '-2px',
      top: '-3px',
      width: '8px',
      height: '8px',
      borderRadius: '99px',
      backgroundColor: colors.now,
      boxShadow: `0 0 0 2px ${colors.nowHalo}`,
    },
    '@media print': {
      display: 'none',
    },
  },
});
