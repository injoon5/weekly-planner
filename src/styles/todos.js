import * as stylex from '@stylexjs/stylex';
import { colors } from '../tokens.stylex.js';

const MOBILE = '@media screen and (max-width: 560px)';
const REDUCE = '@media (prefers-reduced-motion: reduce)';
// Strong ease-out (Emil): starts fast, settles soft. Used for row entrances.
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const rowIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const todos = stylex.create({
  // Drawer.Backdrop paint on mobile; fixed positioning + fade live in base-ui.css.
  scrim: {
    backgroundColor: colors.scrim,
    WebkitBackdropFilter: 'blur(3px)',
    backdropFilter: 'blur(3px)',
  },

  // Desktop companion rail — sits in planner.body, no scrim, so the grid stays
  // editable and today's list live-updates as events change.
  rail: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    width: 'min(360px, calc(100vw - 24px))',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    backgroundColor: colors.paper,
    boxShadow: `0 0 0 1px ${colors.edge}, -12px 0 40px -20px rgba(20,20,26,.28)`,
    transform: 'translateX(0)',
    opacity: 1,
    transitionProperty: 'transform, opacity',
    transitionDuration: '.28s',
    transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
    overflow: 'hidden',
    [MOBILE]: {
      display: 'none',
    },
    '@media print': {
      display: 'none',
    },
    [REDUCE]: {
      transitionDuration: '0ms',
    },
  },

  railClosed: {
    transform: 'translateX(104%)',
    opacity: 0,
    pointerEvents: 'none',
  },

  // Mobile drawer chrome. Slide/swipe motion lives in base-ui.css.
  panel: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.paper,
    borderRadius: '18px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 8px 24px rgba(20,20,26,.10), 0 40px 80px -24px rgba(20,20,26,.44)`,
    outline: 'none',
    overflow: 'hidden',
  },

  panelMobile: {
    height: 'auto',
    maxHeight: 'calc(100dvh - 40px)',
    borderRadius: '20px 20px 0 0',
  },

  // Drawer.Content wraps the body on mobile; without this it's a plain block
  // that swallows the popup's flex column, leaving the list unbounded and
  // unscrollable. Fill the popup and re-establish the column so the scroll
  // area gets a bounded height (and the drawer only swipe-dismisses at the top).
  content: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },

  grip: {
    display: 'none',
    [MOBILE]: {
      display: 'block',
      width: '34px',
      height: '4px',
      borderRadius: '99px',
      backgroundColor: colors.edgeH,
      margin: '8px auto 0',
      flexShrink: 0,
    },
  },

  head: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '18px 18px 14px',
    [MOBILE]: {
      padding: '12px 18px 12px',
    },
  },

  headText: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 650,
    letterSpacing: '-0.018em',
    lineHeight: 1.2,
    color: colors.ink,
  },

  sub: {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.faint,
    letterSpacing: '-0.002em',
    fontVariantNumeric: 'tabular-nums',
  },

  close: {
    flexShrink: 0,
    width: '30px',
    height: '30px',
    marginTop: '-2px',
    marginRight: '-4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: colors.faint,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': { backgroundColor: colors.hov, color: colors.ink },
    ':active': { transform: 'scale(.94)' },
  },

  // Progress hairline — fills left→right with completion.
  progress: {
    flexShrink: 0,
    height: '2px',
    margin: '0 18px',
    borderRadius: '99px',
    backgroundColor: colors.line,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: '99px',
    backgroundColor: colors.ink,
    transformOrigin: 'left center',
    transitionProperty: 'transform',
    transitionDuration: '.42s',
    transitionTimingFunction: EASE_OUT,
    [REDUCE]: {
      transitionDuration: '0ms',
    },
  },

  scroll: {
    flex: 1,
    minHeight: 0,
  },

  list: {
    listStyle: 'none',
    margin: 0,
    padding: '10px 12px 14px',
    display: 'flex',
    flexDirection: 'column',
    [MOBILE]: {
      paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
    },
  },

  rowClip: {
    minHeight: 0,
    overflow: 'hidden',
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    animationName: rowIn,
    animationDuration: '.32s',
    animationTimingFunction: EASE_OUT,
    animationFillMode: 'both',
    [REDUCE]: {
      animationName: 'none',
    },
  },

  // Checkbox.Root: the whole check + label is one toggle target.
  toggle: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '8px 8px 8px 8px',
    borderWidth: 0,
    borderRadius: '10px',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    outline: 'none',
    transitionProperty: 'background-color',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    '@media (hover: hover)': {
      ':hover': { backgroundColor: colors.hov },
    },
    ':focus-visible': {
      boxShadow: `inset 0 0 0 2px ${colors.ink}`,
    },
  },

  box: {
    flexShrink: 0,
    width: '19px',
    height: '19px',
    borderRadius: '6px',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.onInk,
    boxShadow: `inset 0 0 0 1.6px ${colors.edgeH}`,
    backgroundColor: colors.paper,
    transitionProperty: 'background-color, box-shadow, transform',
    transitionDuration: '.18s',
    transitionTimingFunction: EASE_OUT,
    ':active': { transform: 'scale(.9)' },
  },

  boxOn: {
    backgroundColor: colors.ink,
    boxShadow: `inset 0 0 0 1.6px ${colors.ink}`,
  },

  // SVG check that draws itself in via stroke-dashoffset.
  check: {
    width: '11px',
    height: '11px',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: 16,
    strokeDashoffset: 16,
    transitionProperty: 'stroke-dashoffset',
    transitionDuration: '.24s',
    transitionTimingFunction: EASE_OUT,
    [REDUCE]: {
      transitionDuration: '0ms',
    },
  },

  checkOn: {
    strokeDashoffset: 0,
  },

  // Time + title, laid inline so the start time reads as a chip before it.
  rowText: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },

  time: {
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.006em',
    color: colors.muted,
    fontVariantNumeric: 'tabular-nums',
    transitionProperty: 'color, opacity',
    transitionDuration: '.24s',
    transitionTimingFunction: 'ease',
  },

  timeOn: {
    color: colors.faint,
    opacity: 0.72,
  },

  // Wraps the label so the strike line can be absolutely positioned over it.
  labelWrap: {
    position: 'relative',
    minWidth: 0,
    flex: 1,
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.35,
    letterSpacing: '-0.004em',
    color: colors.ink,
    overflowWrap: 'anywhere',
    transitionProperty: 'color, opacity',
    transitionDuration: '.24s',
    transitionTimingFunction: 'ease',
  },

  labelOn: {
    color: colors.faint,
    opacity: 0.72,
  },

  // Strike line drawn left→right on completion (reveal, not a snap).
  strike: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: '1.5px',
    borderRadius: '99px',
    backgroundColor: colors.faint,
    transform: 'scaleX(0)',
    transformOrigin: 'left center',
    transitionProperty: 'transform',
    transitionDuration: '.28s',
    transitionTimingFunction: EASE_OUT,
    pointerEvents: 'none',
    [REDUCE]: {
      transitionDuration: '0ms',
    },
  },

  strikeOn: {
    transform: 'scaleX(1)',
  },

  // Empty state.
  empty: {
    flex: 1,
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px',
    textAlign: 'center',
  },

  emptyIcon: {
    width: '42px',
    height: '42px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    color: colors.faint,
    backgroundColor: colors.hov,
  },

  emptyTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: colors.muted,
  },

  emptyHint: {
    fontSize: '12px',
    fontWeight: 450,
    color: colors.faint,
    lineHeight: 1.5,
    maxWidth: '200px',
  },

  // Header trigger button (in the planner toolbar) + its remaining-count badge.
  trigger: {
    position: 'relative',
  },

  triggerOn: {
    color: colors.ink,
    boxShadow: `inset 0 0 0 1px ${colors.edgeH}, 0 1px 2px rgba(27,27,32,.06)`,
  },

  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '15px',
    height: '15px',
    boxSizing: 'border-box',
    paddingInline: '3.5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '99px',
    backgroundColor: colors.now,
    color: '#fff',
    fontSize: '9.5px',
    fontWeight: 700,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    boxShadow: `0 0 0 1.5px ${colors.paper}`,
    pointerEvents: 'none',
  },
});
