import * as stylex from '@stylexjs/stylex';
import { colors } from '../tokens.stylex.js';

const MOBILE = '@media screen and (max-width: 720px)';

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
  },

  card: {
    backgroundColor: colors.paper,
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '14px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 1px 2px rgba(20,20,26,.04)`,
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

  rowValue: {
    minWidth: 0,
    flex: 1,
    fontSize: '13px',
    fontWeight: 550,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  rowControl: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  swatches: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '7px',
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
    ':hover': {
      transform: 'scale(1.08)',
    },
    ':active': {
      transform: 'scale(.94)',
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
    width: 'auto',
    paddingInline: '9px',
    height: '22px',
    borderRadius: '99px',
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
  },

  tokenBtnDanger: {
    color: colors.danger,
    ':hover': {
      backgroundColor: 'rgba(229,72,77,.10)',
      color: colors.danger,
    },
  },

  // One-time reveal of a freshly created/rotated secret.
  secret: {
    marginTop: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: colors.field,
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums',
    wordBreak: 'break-all',
    lineHeight: 1.5,
  },

  secretHint: {
    marginTop: '6px',
    fontSize: '11px',
    color: colors.danger,
    fontWeight: 550,
  },

  createRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },

  empty: {
    paddingBlock: '10px',
    fontSize: '12px',
    color: colors.faint,
  },

  dangerZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
});
