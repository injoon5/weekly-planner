import * as stylex from '@stylexjs/stylex';
import { colors } from '../tokens.stylex.js';

export const editor = stylex.create({
  // Dialog.Backdrop paint; fixed positioning + fade live in base-ui.css.
  scrim: {
    backgroundColor: colors.scrim,
    WebkitBackdropFilter: 'blur(4px)',
    backdropFilter: 'blur(4px)',
  },

  // Dialog.Popup chrome; centering/sheet position + motion live in base-ui.css.
  dlg: {
    boxSizing: 'border-box',
    maxHeight: 'calc(100dvh - 32px)',
    overflow: 'auto',
    overscrollBehavior: 'contain',
    backgroundColor: colors.paper,
    borderRadius: '16px',
    padding: '14px 16px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 12px rgba(20,20,26,.08), 0 28px 60px -16px rgba(20,20,26,.40)`,
    outline: 'none',
    '@media screen and (max-width: 560px)': {
      maxHeight: 'calc(100dvh - 48px)',
      borderRadius: '18px 18px 0 0',
      paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
      paddingTop: '16px',
      paddingInline: '18px',
    },
  },

  dhead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px',
  },

  dttl: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 650,
    color: colors.ink,
    letterSpacing: '-0.018em',
    lineHeight: 1.2,
  },

  icobtn: {
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
    marginRight: '-6px',
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
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        inset: '-8px',
      },
    },
  },

  inpt: {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    fontWeight: 500,
    color: colors.ink,
    backgroundColor: colors.field,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '9px',
    paddingBlock: '8px',
    paddingInline: '11px',
    outline: 'none',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '.15s',
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
  },

  inptTitle: {
    fontSize: '15px',
    fontWeight: 600,
    marginTop: '2px',
  },

  inptTextarea: {
    resize: 'none',
    lineHeight: 1.5,
    display: 'block',
  },

  field: {
    marginTop: '13px',
  },

  lrow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },

  lbl: {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.muted,
    letterSpacing: '0.012em',
  },

  ldur: {
    fontSize: '11px',
    fontWeight: 550,
    color: colors.faint,
    fontVariantNumeric: 'tabular-nums',
  },

  swrow: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  // Radio.Root renders a <span>, so centering + focus ring are explicit.
  sw: {
    boxSizing: 'border-box',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 4px ${colors.ink}`,
    },
    width: {
      default: '36px',
      // 8 swatches × 36px would clip inside the sheet on 320px-class screens.
      '@media (max-width: 359px)': '32px',
    },
    height: {
      default: '36px',
      '@media (max-width: 359px)': '32px',
    },
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: '99px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        inset: '-4px',
      },
    },
  },

  swDot: {
    width: '21px',
    height: '21px',
    borderRadius: '99px',
    backgroundColor: 'var(--ev-accent)',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '.15s',
    transitionTimingFunction: 'cubic-bezier(.2,0,0,1)',
  },

  swDotOn: {
    boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 3.5px var(--ev-accent)`,
  },

  dayrow: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  // Radio.Root renders a <span>, so centering + focus ring are explicit.
  dayb: {
    boxSizing: 'border-box',
    width: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '99px',
    backgroundColor: 'transparent',
    fontSize: '12.5px',
    fontWeight: 560,
    color: colors.muted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    userSelect: 'none',
    outline: 'none',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
    },
    ':active': {
      transform: 'scale(.96)',
    },
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 4px ${colors.ink}`,
    },
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        inset: '-5px',
      },
    },
  },

  daybSun: {
    color: colors.sun,
  },

  daybSat: {
    color: colors.sat,
  },

  daybOn: {
    backgroundColor: colors.ink,
    color: colors.onInk,
  },

  timerow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  timerowSelect: {
    flex: 1,
    minWidth: 0,
  },

  // Sizes the shared UiSelect trigger up to match the editor's other inputs.
  timeTrigger: {
    borderRadius: '9px',
    paddingBlock: '8px',
    paddingInline: '11px',
    fontSize: '13.5px',
    fontWeight: 500,
  },

  arrow: {
    color: colors.faint,
    fontSize: '12px',
    flexShrink: 0,
  },

  dfoot: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '18px',
  },

  sp: {
    flex: 1,
  },
});
