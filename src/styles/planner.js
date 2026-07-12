import * as stylex from '@stylexjs/stylex';
import { colors, layout } from '../tokens.stylex.js';

const MOBILE = '@media (max-width: 720px)';

export const planner = stylex.create({
  app: {
    height: '100vh',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg,
    color: colors.ink,
  },

  boot: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.faint,
    fontSize: '13px',
    fontWeight: 550,
  },

  top: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px 10px',
    padding: '10px 14px 8px',
    [MOBILE]: {
      padding: '8px 10px 6px',
    },
    '@media print': {
      padding: '0 0 10px',
      gap: '10px',
    },
  },

  h1: {
    margin: 0,
    flexShrink: 0,
    fontSize: '15.5px',
    fontWeight: 650,
    letterSpacing: '-0.011em',
    lineHeight: 1.2,
    '@media print': {
      fontSize: '15px',
    },
  },

  pbname: {
    display: 'none',
    fontWeight: 500,
    color: colors.muted,
    '@media print': {
      display: 'inline',
    },
  },

  prange: {
    flexShrink: 0,
    fontSize: '11px',
    fontWeight: 550,
    color: colors.faint,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.01em',
    '@media print': {
      display: 'none',
    },
  },

  printMeta: {
    display: 'none',
    '@media print': {
      display: 'flex',
      gap: '22px',
      marginLeft: 'auto',
      fontSize: '10px',
      fontWeight: 550,
      color: '#6E6E76',
    },
  },

  printMetaItem: {
    display: 'flex',
    alignItems: 'center',
  },

  printMetaBlank: {
    display: 'inline-block',
    width: '96px',
    marginLeft: '7px',
    borderBottom: '1px solid #C6C6CC',
    verticalAlign: '-2px',
  },

  printMetaVal: {
    color: '#1B1B20',
    fontWeight: 600,
    marginLeft: '6px',
    fontVariantNumeric: 'tabular-nums',
  },

  tabs: {
    flex: '1 1 160px',
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
    padding: '2px',
    margin: '-2px 0',
    [MOBILE]: {
      order: 4,
      flexBasis: '100%',
      padding: '9px 2px',
      margin: '-9px 0',
    },
    '@media print': {
      display: 'none',
    },
  },

  tab: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    maxWidth: '156px',
    borderWidth: 0,
    borderRadius: '8px',
    padding: '5.5px 10px',
    fontSize: '12.5px',
    fontWeight: 550,
    letterSpacing: '-0.002em',
    color: colors.muted,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionProperty: 'background-color, color, box-shadow',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
    },
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        left: '-1px',
        right: '-1px',
        top: '-7px',
        bottom: '-7px',
      },
    },
  },

  tabOn: {
    color: colors.ink,
    backgroundColor: colors.paper,
    boxShadow: `inset 0 0 0 1px ${colors.edge}, 0 1px 2px rgba(20,20,26,.05)`,
  },

  tabName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  tadd: {
    flexShrink: 0,
    width: '26px',
    height: '26px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '99px',
    backgroundColor: 'transparent',
    color: colors.faint,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
      color: colors.ink,
    },
    ':active': {
      transform: 'scale(.92)',
    },
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        left: '-1px',
        right: '-1px',
        top: '-9px',
        bottom: '-9px',
      },
    },
  },

  hbtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginLeft: 'auto',
    '@media print': {
      display: 'none',
    },
  },

  btn: {
    boxSizing: 'border-box',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    borderWidth: 0,
    borderRadius: '9px',
    paddingBlock: 0,
    paddingInline: '12px',
    fontSize: '12.5px',
    fontWeight: 560,
    letterSpacing: '-0.002em',
    lineHeight: 1,
    color: colors.ink,
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'manipulation',
    fontFamily: 'inherit',
    transitionProperty: 'background-color, box-shadow, transform, color',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':active': {
      transform: 'scale(.96)',
    },
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        left: '-3px',
        right: '-3px',
        top: '-7px',
        bottom: '-7px',
      },
    },
    '@media (max-width: 720px)': {
      paddingInline: '9px',
    },
  },

  btnPrimary: {
    backgroundColor: colors.ink,
    color: colors.onInk,
    ':hover': {
      opacity: 0.92,
    },
  },

  btnPlain: {
    backgroundColor: colors.paper,
    color: colors.muted,
    boxShadow: `inset 0 0 0 1px ${colors.edge}, 0 1px 2px rgba(27,27,32,.05)`,
    ':hover': {
      color: colors.ink,
      boxShadow: `inset 0 0 0 1px ${colors.edgeH}, 0 1px 2px rgba(27,27,32,.06)`,
    },
  },

  btnGhost: {
    backgroundColor: 'transparent',
    color: colors.muted,
    ':hover': {
      backgroundColor: colors.hov,
    },
  },

  btnDanger: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    color: colors.now,
    touchAction: 'none',
    userSelect: 'none',
    ':hover': {
      backgroundColor: 'rgba(229,72,77,.10)',
    },
  },

  btnLabelHide: {
    display: 'inline',
    '@media (max-width: 720px)': {
      display: 'none',
    },
  },

  ibtn: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '9px',
    backgroundColor: colors.paper,
    color: colors.muted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: `inset 0 0 0 1px ${colors.edge}, 0 1px 2px rgba(27,27,32,.05)`,
    transitionProperty: 'color, box-shadow, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      color: colors.ink,
      boxShadow: `inset 0 0 0 1px ${colors.edgeH}, 0 1px 2px rgba(27,27,32,.06)`,
    },
    ':active': {
      transform: 'scale(.94)',
    },
    '@media print': {
      display: 'none',
    },
  },

  userchip: {
    boxSizing: 'border-box',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    maxWidth: '168px',
    borderWidth: 0,
    borderRadius: '9px',
    paddingBlock: 0,
    paddingInline: '10px',
    fontFamily: 'inherit',
    fontSize: '11.5px',
    fontWeight: 550,
    lineHeight: 1,
    color: colors.muted,
    backgroundColor: colors.paper,
    boxShadow: `inset 0 0 0 1px ${colors.edge}, 0 1px 2px rgba(27,27,32,.05)`,
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums',
    transitionProperty: 'color, box-shadow, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      color: colors.ink,
      boxShadow: `inset 0 0 0 1px ${colors.edgeH}, 0 1px 2px rgba(27,27,32,.06)`,
    },
    ':active': {
      transform: 'scale(.96)',
    },
    [MOBILE]: {
      maxWidth: '120px',
      paddingInline: '8px',
    },
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        left: '-2px',
        right: '-2px',
        top: '-7px',
        bottom: '-7px',
      },
    },
  },

  chipText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
