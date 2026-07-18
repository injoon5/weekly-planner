import * as stylex from '@stylexjs/stylex';
import { colors, layout } from './tokens.stylex.js';

const COARSE = '@media (pointer: coarse)';
const PRINT = '@media print';
const REDUCE_TRANSPARENCY = '@media (prefers-reduced-transparency: reduce)';

export const reset = stylex.create({
  html: {
    height: '100%',
    colorScheme: {
      default: 'light dark',
      // Avoid iOS Safari painting overflow scrollports black in print preview.
      [PRINT]: 'light',
    },
  },
  body: {
    margin: 0,
    height: '100%',
    // Base UI: anchors popup backdrops correctly on iOS 26+ Safari.
    position: 'relative',
    backgroundColor: colors.bg,
    color: colors.ink,
    fontFamily: layout.font,
    fontSize: '14px',
    lineHeight: 1.45,
    fontSynthesis: 'none',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textRendering: 'optimizeLegibility',
    WebkitTextSizeAdjust: '100%',
    WebkitTapHighlightColor: 'transparent',
    transitionProperty: 'background-color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    [PRINT]: {
      backgroundColor: '#FFFFFF',
      color: '#1B1B20',
    },
  },
  app: {
    height: '100%',
    // Base UI: keep the app in its own stacking context so portaled popups
    // (appended to <body>) always paint above page content.
    isolation: 'isolate',
  },
  boot: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    color: colors.muted,
    fontSize: '13px',
    fontWeight: 500,
  },
});

export const ui = stylex.create({
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: '9px',
    paddingBlock: '7px',
    paddingInline: '12px',
    fontSize: '12.5px',
    fontWeight: 560,
    letterSpacing: '-0.002em',
    color: colors.ink,
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'manipulation',
    fontFamily: 'inherit',
    transitionProperty: 'background-color, box-shadow, transform, color, opacity',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    ':active': { transform: 'scale(0.96)' },
    ':disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
      transform: 'none',
      pointerEvents: 'none',
    },
  },
  btnPrimary: {
    backgroundColor: colors.ink,
    color: colors.onInk,
    ':hover': { opacity: 0.92 },
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
    ':hover': { backgroundColor: colors.hov },
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '10px',
    paddingBlock: '9px',
    paddingInline: '11px',
    backgroundColor: colors.field,
    color: colors.ink,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    '::placeholder': {
      color: colors.faint,
      fontWeight: 450,
    },
    ':hover': {
      backgroundColor: colors.fieldH,
    },
    ':focus': {
      backgroundColor: colors.paper,
      borderColor: colors.ink,
      boxShadow: '0 0 0 3px rgba(27,27,32,.07)',
    },
    ':disabled': { opacity: 0.55 },
  },
  inputSm: {
    paddingBlock: '7px',
    paddingInline: '10px',
    fontSize: '12.5px',
    borderRadius: '8px',
    fontVariantNumeric: 'tabular-nums',
  },

  /** Swipe affordance for bottom drawers — mirrors the to-dos panel grip. */
  drawerGrip: {
    display: 'block',
    width: '34px',
    height: '4px',
    borderRadius: '99px',
    backgroundColor: colors.edgeH,
    margin: '-4px auto 10px',
    flexShrink: 0,
  },

  /** Brand mark tiles (Login + Landing). */
  mark: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: colors.ink,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3px',
    padding: '8px',
    flexShrink: 0,
  },
  markA: {
    borderRadius: '3px',
    backgroundColor: '#E96D4F',
    alignSelf: 'end',
    height: '14px',
  },
  markB: {
    borderRadius: '3px',
    backgroundColor: '#4E9EDB',
    alignSelf: 'start',
    height: '12px',
  },

  hintFine: {
    display: 'block',
    [COARSE]: { display: 'none' },
  },
  hintCoarse: {
    display: 'none',
    [COARSE]: { display: 'block' },
  },

  /** Compose onto frosted surfaces: print + reduced-transparency fallbacks. */
  glassOpaque: {
    [PRINT]: {
      backgroundColor: '#fff',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
    [REDUCE_TRANSPARENCY]: {
      backgroundColor: colors.paper,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
  },
});
