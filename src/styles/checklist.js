import * as stylex from '@stylexjs/stylex';
import { colors } from '../tokens.stylex.js';

const MOBILE = '@media screen and (max-width: 560px)';
const REDUCE = '@media (prefers-reduced-motion: reduce)';

const rowIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const checklist = stylex.create({
  rail: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    width: 'min(320px, calc(100vw - 24px))',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.paper,
    boxShadow: `0 0 0 1px ${colors.edge}, -12px 0 40px -20px rgba(20,20,26,.28)`,
    transform: 'translateX(0)',
    transitionProperty: 'transform, opacity',
    transitionDuration: '.28s',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
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

  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 14px 10px 16px',
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: '15.5px',
    fontWeight: 650,
    letterSpacing: '-0.018em',
    lineHeight: 1.2,
    color: colors.ink,
  },

  close: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '8px',
    flexShrink: 0,
    backgroundColor: 'transparent',
    color: colors.faint,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginRight: '-4px',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
      color: colors.ink,
    },
    ':active': {
      transform: 'scale(.96)',
    },
  },

  days: {
    display: 'flex',
    gap: '2px',
    padding: '0 12px 10px',
    flexShrink: 0,
  },

  dayBtn: {
    flex: 1,
    minWidth: 0,
    height: '30px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: colors.faint,
    fontSize: '12px',
    fontWeight: 560,
    letterSpacing: '-0.01em',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
      color: colors.ink,
    },
    ':active': {
      transform: 'scale(.96)',
    },
  },

  dayBtnOn: {
    backgroundColor: colors.field,
    color: colors.ink,
    fontWeight: 620,
    boxShadow: `inset 0 0 0 1px ${colors.edge}`,
  },

  dayBtnToday: {
    color: colors.ink,
  },

  scroll: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    overscrollBehavior: 'contain',
    padding: '0 6px 16px',
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.sb} transparent`,
  },

  section: {
    padding: '8px 8px 4px',
  },

  sectionLabel: {
    margin: '0 0 6px 6px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: colors.faint,
    textTransform: 'none',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },

  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '9px 8px',
    borderRadius: '10px',
    cursor: 'default',
    transitionProperty: 'background-color',
    transitionDuration: '.14s',
    transitionTimingFunction: 'ease',
    animationName: rowIn,
    animationDuration: '.32s',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    animationFillMode: 'both',
    [REDUCE]: {
      animationName: 'none',
    },
    ':hover': {
      backgroundColor: colors.hov,
    },
  },

  rowInteractive: {
    cursor: 'pointer',
  },

  rowBody: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingTop: '1px',
  },

  rowTitle: {
    fontSize: '13.5px',
    fontWeight: 550,
    letterSpacing: '-0.011em',
    lineHeight: 1.3,
    color: colors.ink,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transitionProperty: 'color, opacity',
    transitionDuration: '.18s',
    transitionTimingFunction: 'ease',
  },

  rowTitleDone: {
    textDecorationLine: 'line-through',
    textDecorationThickness: '1px',
    textDecorationColor: colors.faint,
    color: colors.faint,
    opacity: 0.78,
  },

  rowMeta: {
    fontSize: '11px',
    fontWeight: 500,
    color: colors.faint,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.01em',
    lineHeight: 1.2,
  },

  empty: {
    margin: '4px 6px 8px',
    fontSize: '12.5px',
    fontWeight: 500,
    color: colors.faint,
    letterSpacing: '-0.004em',
    lineHeight: 1.4,
  },

  addRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '4px 2px 0',
    padding: '2px 6px',
  },

  addInput: {
    flex: 1,
    minWidth: 0,
    height: '34px',
    borderWidth: 0,
    borderRadius: '9px',
    paddingInline: '11px',
    backgroundColor: colors.field,
    color: colors.ink,
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '-0.008em',
    fontFamily: 'inherit',
    outline: 'none',
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    '::placeholder': {
      color: colors.faint,
      opacity: 1,
    },
    ':focus': {
      backgroundColor: colors.fieldH,
      boxShadow: `inset 0 0 0 1px ${colors.edgeH}`,
    },
  },

  addBtn: {
    flexShrink: 0,
    width: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '9px',
    backgroundColor: colors.ink,
    color: colors.onInk,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionProperty: 'opacity, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      opacity: 0.92,
    },
    ':active': {
      transform: 'scale(.96)',
    },
    ':disabled': {
      opacity: 0.35,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },

  deleteBtn: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '7px',
    backgroundColor: 'transparent',
    color: colors.faint,
    cursor: 'pointer',
    fontFamily: 'inherit',
    opacity: 0,
    transitionProperty: 'opacity, background-color, color, transform',
    transitionDuration: '.14s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
      color: colors.danger,
    },
    ':active': {
      transform: 'scale(.96)',
    },
  },

  // Checkbox chrome (StyleX className for Base UI Root)
  check: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: '18px',
    height: '18px',
    marginTop: '1px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderRadius: '5px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: colors.edgeH,
    backgroundColor: colors.paper,
    color: colors.onInk,
    cursor: 'pointer',
    outline: 'none',
    transitionProperty: 'background-color, border-color, transform, box-shadow',
    transitionDuration: '.16s',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    ':active': {
      transform: 'scale(.96)',
    },
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 4px ${colors.ink}`,
    },
  },

  checkOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },

  checkDisabled: {
    cursor: 'default',
    opacity: 0.55,
    ':active': {
      transform: 'none',
    },
  },

  checkIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: '.22s',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    [REDUCE]: {
      transitionDuration: '0ms',
    },
  },

  checkIndicatorHidden: {
    opacity: 0,
    transform: 'scale(.25)',
    filter: 'blur(4px)',
  },

  checkIndicatorShown: {
    opacity: 1,
    transform: 'scale(1)',
    filter: 'blur(0px)',
  },
});
