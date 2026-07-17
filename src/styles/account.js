import * as stylex from '@stylexjs/stylex';
import { colors } from './tokens.stylex.js';

const MOBILE = '@media screen and (max-width: 720px)';
const HOVER = '@media (hover: hover) and (pointer: fine)';

// Occasional page → a single subtle fade-up per card, staggered via
// inline animationDelay. Compositor props only; off under reduced motion.
const cardIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const account = stylex.create({
  root: {
    minHeight: stylex.firstThatWorks('100dvh', '100vh'),
    backgroundColor: colors.bg,
    color: colors.ink,
  },

  shell: {
    width: 'min(620px, 100%)',
    margin: '0 auto',
    padding: '20px 16px 48px',
    boxSizing: 'border-box',
    [MOBILE]: {
      padding: '14px 12px 40px',
    },
  },

  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
  },

  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 650,
    letterSpacing: '-0.014em',
    textWrap: 'balance',
  },

  card: {
    backgroundColor: colors.paper,
    borderRadius: '14px',
    padding: '18px',
    marginBottom: '14px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 1px 2px rgba(20,20,26,.04)`,
    animationName: cardIn,
    animationDuration: '.3s',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
    },
    [MOBILE]: {
      padding: '16px',
    },
  },

  cardTitle: {
    margin: '0 0 2px',
    fontSize: '13.5px',
    fontWeight: 650,
    letterSpacing: '-0.006em',
  },

  cardHint: {
    margin: '0 0 12px',
    fontSize: '11.5px',
    lineHeight: 1.55,
    color: colors.faint,
    textWrap: 'pretty',
  },

  cardHintTight: {
    marginBottom: 0,
  },

  // Live identity preview: initial + color update as the user edits.
  profileHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },

  avatar: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    borderRadius: '99px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 650,
    color: '#fff',
    letterSpacing: '-0.02em',
    userSelect: 'none',
    transitionProperty: 'background-color',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
  },

  profileMeta: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },

  profileName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 650,
    letterSpacing: '-0.006em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  profileEmail: {
    fontSize: '11.5px',
    fontWeight: 500,
    color: colors.faint,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  divider: {
    height: '1px',
    backgroundColor: colors.line,
    margin: '10px 0',
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBlock: '7px',
  },

  rowLabel: {
    flexShrink: 0,
    width: '84px',
    fontSize: '12px',
    fontWeight: 600,
    color: colors.muted,
  },

  rowControl: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  themeSelect: {
    width: '124px',
    flex: 'none',
  },

  // Inline row action next to a flexible input — never wraps or shrinks.
  rowBtn: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },

  swatches: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },

  swatch: {
    width: '22px',
    height: '22px',
    padding: 0,
    borderWidth: 0,
    borderRadius: '99px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '.15s',
    transitionTimingFunction: 'ease',
    [HOVER]: {
      ':hover': {
        transform: 'scale(1.08)',
      },
    },
    ':active': {
      transform: 'scale(.94)',
    },
    // ±4px keeps neighbors' hit areas from overlapping across the 8px gap.
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        inset: '-8px -4px',
      },
    },
  },

  swatchOn: {
    boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 4px ${colors.ink}`,
  },

  swatchAuto: {
    backgroundColor: colors.field,
    color: colors.muted,
    fontSize: '10px',
    fontWeight: 650,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    width: 'auto',
    paddingInline: '9px',
    height: '22px',
    borderRadius: '99px',
  },

  swatchAutoDot: {
    width: '8px',
    height: '8px',
    borderRadius: '99px',
    flexShrink: 0,
  },

  tokenRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBlock: '8px',
    borderBottom: `1px solid ${colors.line}`,
    ':last-of-type': {
      borderBottom: 'none',
    },
  },

  keyIcon: {
    flexShrink: 0,
    width: '32px',
    height: '32px',
    borderRadius: '99px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.field,
    color: colors.muted,
  },

  tokenMeta: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  tokenName: {
    fontSize: '12.5px',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  tokenSub: {
    fontSize: '11px',
    color: colors.faint,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  tokenBtn: {
    flexShrink: 0,
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    borderWidth: 0,
    borderRadius: '7px',
    paddingInline: '9px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: colors.muted,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    userSelect: 'none',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '.13s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
      color: colors.ink,
    },
    ':active': {
      transform: 'scale(.96)',
    },
    ':disabled': {
      opacity: 0.4,
      cursor: 'default',
    },
    // Tall (44px) but narrow extension: ±4px sideways so adjacent token
    // actions in the same 10px-gapped row never overlap.
    '@media (pointer: coarse)': {
      position: 'relative',
      '::after': {
        content: '""',
        position: 'absolute',
        inset: '-8px -4px',
      },
    },
  },

  // HoldToConfirm host: relative + hidden so the red fill clips to the pill.
  tokenBtnDanger: {
    position: 'relative',
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    color: colors.danger,
    ':hover': {
      backgroundColor: 'rgba(229,72,77,.10)',
      color: colors.danger,
    },
  },

  // One-time reveal of a freshly created/rotated secret.
  secret: {
    marginTop: '12px',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: colors.field,
    boxShadow: `inset 0 0 0 1px ${colors.edge}`,
  },

  secretCode: {
    display: 'block',
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums',
    wordBreak: 'break-all',
    lineHeight: 1.5,
    color: colors.ink,
    userSelect: 'all',
  },

  secretFoot: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  secretHint: {
    flex: 1,
    minWidth: 0,
    fontSize: '11px',
    color: colors.danger,
    fontWeight: 550,
    textWrap: 'pretty',
  },

  createRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },

  empty: {
    paddingBlock: '10px',
    fontSize: '12px',
    color: colors.faint,
    textWrap: 'pretty',
  },

  dangerZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
});
