import * as stylex from '@stylexjs/stylex';
import { colors } from '../tokens.stylex.js';

export const menus = stylex.create({
  // Invisible Popover.Backdrop: swallows the outside press so a click that
  // dismisses a menu can't also activate whatever sits underneath.
  mscrim: {
    position: 'fixed',
    inset: 0,
    zIndex: 89,
  },

  // Popover.Popup chrome; positioning + enter/exit motion live in base-ui.css.
  pop: {
    boxSizing: 'border-box',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: colors.paper,
    borderRadius: '12px',
    padding: '6px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 10px rgba(20,20,26,.08), 0 16px 40px -12px rgba(20,20,26,.30)`,
    outline: 'none',
  },

  pin: {
    padding: '3px',
    marginBottom: '2px',
  },

  drow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    // Left-pads labels onto the popover's text rail (captions, item icons,
    // member names all start at the same x) instead of outdenting past it.
    padding: '2px 3px 3px 9px',
  },

  drowLabel: {
    flexShrink: 0,
    width: '40px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.012em',
    color: colors.muted,
  },

  drowInput: {
    flex: 1,
    minWidth: 0,
    fontSize: '12.5px',
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
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: 550,
    letterSpacing: '-0.002em',
    color: colors.ink,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    userSelect: 'none',
    touchAction: 'manipulation',
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

  hold: {
    touchAction: 'none',
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
    textWrap: 'pretty',
  },

  // Section headings inside popovers — larger and darker than the fine-print
  // hints so "링크 공유" reads as a title, not a footnote.
  mcapStrong: {
    fontSize: '12px',
    fontWeight: 650,
    letterSpacing: '0.005em',
    color: colors.muted,
  },

  mcapFirst: {
    paddingTop: '7px',
  },

  mcapTight: {
    paddingTop: 0,
  },

  shareStatus: {
    padding: '0 9px 6px',
    fontSize: '11.5px',
    fontWeight: 550,
    letterSpacing: '-0.002em',
    color: colors.muted,
  },

  colorRow: {
    // Centers the 18px swatches on the same vertical axis as menu-item icons.
    paddingLeft: '7px',
  },

  shareUrl: {
    boxSizing: 'border-box',
    display: 'block',
    width: 'calc(100% - 6px)',
    margin: '1px 3px 4px',
    padding: '7px 9px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: colors.field,
    font: 'inherit',
    fontSize: '11px',
    lineHeight: 1.45,
    fontWeight: 500,
    textAlign: 'left',
    color: colors.muted,
    fontVariantNumeric: 'tabular-nums',
    wordBreak: 'break-all',
    cursor: 'pointer',
    ':hover': {
      color: colors.ink,
    },
    ':disabled': {
      cursor: 'default',
      opacity: 0.7,
    },
  },

  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '3px 3px 3px 9px',
    minHeight: '32px',
    boxSizing: 'border-box',
  },

  memberName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '12.5px',
    fontWeight: 550,
    letterSpacing: '-0.002em',
    color: colors.ink,
  },

  memberRoleSelect: {
    flexShrink: 0,
    width: '76px',
  },

  memberRoleText: {
    flexShrink: 0,
    paddingRight: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: colors.muted,
  },

  memberRemove: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: '6px',
    padding: 0,
    backgroundColor: 'transparent',
    color: colors.now,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionProperty: 'background-color, transform',
    transitionDuration: '.13s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: 'rgba(229,72,77,.10)',
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

  miGrow: {
    flex: 1,
  },

  // Switch.Root doubles as the track.
  switchTrack: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: '30px',
    height: '18px',
    padding: '2px',
    borderWidth: 0,
    borderRadius: '99px',
    display: 'inline-flex',
    backgroundColor: colors.edgeH,
    cursor: 'pointer',
    fontFamily: 'inherit',
    outline: 'none',
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '.18s',
    transitionTimingFunction: 'ease',
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 3.5px ${colors.ink}`,
    },
  },

  switchTrackOn: {
    backgroundColor: colors.ink,
  },

  switchThumb: {
    width: '14px',
    height: '14px',
    borderRadius: '99px',
    backgroundColor: colors.paper,
    boxShadow: '0 1px 2px rgba(0,0,0,.22), 0 0 0 0.5px rgba(0,0,0,.04)',
    transform: 'translateX(0)',
    transitionProperty: 'transform',
    transitionDuration: '.18s',
    transitionTimingFunction: 'cubic-bezier(.2,0,0,1)',
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0ms',
    },
  },

  switchThumbOn: {
    transform: 'translateX(12px)',
  },

  swatch: {
    flexShrink: 0,
    width: '18px',
    height: '18px',
    padding: 0,
    borderWidth: 0,
    borderRadius: '99px',
    backgroundColor: 'transparent',
    display: 'flex',
    cursor: 'pointer',
    fontFamily: 'inherit',
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        inset: '-6px',
      },
    },
  },

  swatchDot: {
    width: '100%',
    height: '100%',
    borderRadius: '99px',
    backgroundColor: 'var(--ev-accent)',
    transitionProperty: 'transform, box-shadow, background-color, opacity',
    transitionDuration: '.15s',
    transitionTimingFunction: 'cubic-bezier(.2,0,0,1)',
  },

  swatchDotOff: {
    backgroundColor: 'transparent',
    boxShadow: 'inset 0 0 0 1.5px var(--ev-accent)',
    opacity: 0.55,
    transform: 'scale(.9)',
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

});
