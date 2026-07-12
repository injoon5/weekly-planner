import * as stylex from '@stylexjs/stylex';
import { colors } from '../tokens.stylex.js';

const popIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(-4px) scale(.98)' },
});

const toastIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translate(-50%, 8px)' },
});

export const menus = stylex.create({
  mscrim: {
    position: 'fixed',
    inset: 0,
    zIndex: 89,
  },

  pop: {
    position: 'fixed',
    zIndex: 90,
    width: '232px',
    backgroundColor: colors.paper,
    borderRadius: '12px',
    padding: '6px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 10px rgba(20,20,26,.08), 0 16px 40px -12px rgba(20,20,26,.30)`,
    transformOrigin: 'top',
    animationName: popIn,
    animationDuration: '.16s',
    animationTimingFunction: 'cubic-bezier(.2,0,0,1)',
  },

  pin: {
    padding: '3px',
    marginBottom: '2px',
  },

  drow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '2px 3px 3px',
  },

  drowLabel: {
    flexShrink: 0,
    width: '40px',
    fontSize: '11px',
    fontWeight: 600,
    color: colors.muted,
  },

  drowInput: {
    flex: 1,
    minWidth: 0,
    fontSize: '12px',
    fontWeight: 550,
    paddingBlock: '6px',
    paddingInline: '9px',
    fontVariantNumeric: 'tabular-nums',
  },

  mi: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: '8px 9px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 550,
    letterSpacing: '-0.002em',
    color: colors.ink,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    userSelect: 'none',
    touchAction: 'none',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '.13s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
    },
    ':active': {
      transform: 'scale(0.98)',
    },
    ':disabled': {
      opacity: 0.38,
      cursor: 'default',
      transform: 'none',
    },
    '@media (pointer: coarse)': {
      padding: '10px 9px',
    },
  },

  miRed: {
    color: colors.now,
    ':hover': {
      backgroundColor: 'rgba(229,72,77,.10)',
    },
    ':disabled': {
      ':hover': {
        backgroundColor: 'transparent',
      },
    },
  },

  holdFill: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    backgroundColor: 'rgba(229, 72, 77, 0.22)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  holdContent: {
    position: 'relative',
    zIndex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    minWidth: 0,
  },

  miIconWrap: {
    display: 'flex',
    flexShrink: 0,
    opacity: 0.72,
  },

  miLabel: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  mdiv: {
    height: '1px',
    backgroundColor: colors.line,
    margin: '5px 4px',
  },

  mcap: {
    padding: '6px 9px 5px',
    fontSize: '10.5px',
    lineHeight: 1.5,
    color: colors.faint,
  },

  hintFine: {
    display: 'block',
    '@media (pointer: coarse)': {
      display: 'none',
    },
  },

  hintCoarse: {
    display: 'none',
    '@media (pointer: coarse)': {
      display: 'block',
    },
  },

  toast: {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(20px + env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    zIndex: 120,
    backgroundColor: colors.chipBg,
    color: colors.chipFg,
    fontSize: '12px',
    fontWeight: 550,
    padding: '8px 14px',
    borderRadius: '99px',
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 24px -6px rgba(0,0,0,.35)',
    animationName: toastIn,
    animationDuration: '.22s',
    animationTimingFunction: 'cubic-bezier(.2,0,0,1)',
    pointerEvents: 'none',
    '@media print': {
      display: 'none',
    },
  },
});
