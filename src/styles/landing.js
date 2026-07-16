import * as stylex from '@stylexjs/stylex';
import { colors, layout } from '../tokens.stylex.js';

const MOBILE = '@media screen and (max-width: 720px)';
const HOVER = '@media (hover: hover) and (pointer: fine)';
const REDUCE = '@media (prefers-reduced-motion: reduce)';

const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const landing = stylex.create({
  root: {
    minHeight: '100dvh',
    backgroundColor: colors.bg,
    color: colors.ink,
    fontFamily: layout.font,
    overflowX: 'hidden',
  },

  // Soft atmosphere — not flat, not purple, not cream/terracotta.
  atmosphere: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    backgroundImage: `
      radial-gradient(900px 520px at 8% -8%, color-mix(in srgb, #E96D4F 16%, transparent), transparent 62%),
      radial-gradient(780px 460px at 96% 4%, color-mix(in srgb, #4E9EDB 14%, transparent), transparent 58%),
      radial-gradient(640px 420px at 50% 110%, color-mix(in srgb, #1B1B20 5%, transparent), transparent 55%)
    `,
  },

  grain: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    opacity: 0.035,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  },

  shell: {
    position: 'relative',
    zIndex: 1,
  },

  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    paddingBlock: '18px',
    paddingInline: {
      default: '28px',
      [MOBILE]: '18px',
    },
    maxWidth: '1120px',
    marginInline: 'auto',
  },

  navBrand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: colors.ink,
  },

  mark: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: colors.ink,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2.5px',
    padding: '6px',
    flexShrink: 0,
  },

  markA: {
    borderRadius: '2.5px',
    backgroundColor: '#E96D4F',
    alignSelf: 'end',
    height: '11px',
  },

  markB: {
    borderRadius: '2.5px',
    backgroundColor: '#4E9EDB',
    alignSelf: 'start',
    height: '9px',
  },

  navName: {
    fontSize: '14px',
    fontWeight: 620,
    letterSpacing: '-0.02em',
  },

  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  navBtn: {
    minHeight: '40px',
    paddingBlock: '8px',
    paddingInline: '14px',
  },

  // —— Hero: one composition, brand-first, full-bleed visual ——
  hero: {
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    minHeight: {
      default: 'calc(100dvh - 64px)',
      [MOBILE]: 'auto',
    },
    maxWidth: '1120px',
    marginInline: 'auto',
    paddingInline: {
      default: '28px',
      [MOBILE]: '18px',
    },
    paddingBottom: {
      default: '0',
      [MOBILE]: '28px',
    },
  },

  heroCopy: {
    maxWidth: '560px',
    paddingTop: {
      default: '48px',
      [MOBILE]: '28px',
    },
    paddingBottom: {
      default: '36px',
      [MOBILE]: '28px',
    },
  },

  brand: {
    margin: 0,
    fontSize: {
      default: 'clamp(42px, 6.4vw, 72px)',
      [MOBILE]: '40px',
    },
    fontWeight: 680,
    letterSpacing: '-0.045em',
    lineHeight: 1.02,
    textWrap: 'balance',
    color: colors.ink,
  },

  headline: {
    margin: 0,
    marginTop: '18px',
    fontSize: {
      default: '20px',
      [MOBILE]: '17px',
    },
    fontWeight: 520,
    letterSpacing: '-0.018em',
    lineHeight: 1.35,
    color: colors.ink,
    textWrap: 'balance',
    maxWidth: '28ch',
  },

  support: {
    margin: 0,
    marginTop: '12px',
    fontSize: '14.5px',
    fontWeight: 450,
    lineHeight: 1.55,
    color: colors.muted,
    textWrap: 'pretty',
    maxWidth: '42ch',
  },

  ctas: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px',
    marginTop: '28px',
  },

  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '44px',
    paddingBlock: '11px',
    paddingInline: '18px',
    borderRadius: '11px',
    borderWidth: 0,
    fontSize: '13.5px',
    fontWeight: 580,
    letterSpacing: '-0.01em',
    fontFamily: 'inherit',
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'manipulation',
    textDecoration: 'none',
    transitionProperty: 'transform, opacity, background-color, box-shadow, color',
    transitionDuration: '150ms',
    transitionTimingFunction: easeOut,
    ':active': { transform: 'scale(0.97)' },
    ':disabled': {
      opacity: 0.45,
      cursor: 'not-allowed',
      pointerEvents: 'none',
      transform: 'none',
    },
  },

  btnPrimary: {
    backgroundColor: colors.ink,
    color: colors.onInk,
    [HOVER]: {
      ':hover': { opacity: 0.92 },
    },
  },

  btnSecondary: {
    backgroundColor: 'transparent',
    color: colors.ink,
    boxShadow: `inset 0 0 0 1px ${colors.edgeH}`,
    [HOVER]: {
      ':hover': {
        backgroundColor: colors.hov,
      },
    },
  },

  err: {
    marginTop: '12px',
    fontSize: '12.5px',
    fontWeight: 550,
    color: colors.danger,
    textWrap: 'pretty',
  },

  // Full-bleed product plane under the copy
  stage: {
    position: 'relative',
    marginInline: {
      default: '-28px',
      [MOBILE]: '-18px',
    },
    minHeight: {
      default: '340px',
      [MOBILE]: '260px',
    },
    overflow: 'hidden',
    maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
  },

  stageGrid: {
    display: 'grid',
    gridTemplateColumns: '44px repeat(7, 1fr)',
    gridTemplateRows: '36px repeat(8, 28px)',
    gap: 0,
    width: '100%',
    minWidth: '640px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    backgroundColor: `color-mix(in srgb, ${colors.paper} 72%, transparent)`,
    backdropFilter: 'blur(10px)',
  },

  gutCell: {
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: colors.line,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
    color: colors.faint,
    fontSize: '10px',
    fontWeight: 550,
    fontVariantNumeric: 'tabular-nums',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingTop: '4px',
    paddingRight: '8px',
  },

  headCell: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: colors.line,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.01em',
    color: colors.muted,
  },

  headSun: { color: '#C7433E' },
  headSat: { color: '#3F71C2' },

  cell: {
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: `color-mix(in srgb, ${colors.line} 70%, transparent)`,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: `color-mix(in srgb, ${colors.line} 70%, transparent)`,
    position: 'relative',
  },

  block: {
    position: 'absolute',
    left: '3px',
    right: '3px',
    borderRadius: '6px',
    paddingBlock: '5px',
    paddingInline: '7px',
    fontSize: '10.5px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
    color: colors.ink,
    boxShadow: '0 1px 0 rgba(27,27,32,.04)',
    outlineWidth: '1px',
    outlineStyle: 'solid',
    outlineColor: 'oklch(0 0 0 / 0.08)',
  },

  blockCoral: {
    backgroundColor: 'color-mix(in srgb, #E96D4F 22%, white)',
    top: '8px',
    height: '48px',
  },
  blockSky: {
    backgroundColor: 'color-mix(in srgb, #4E9EDB 22%, white)',
    top: '4px',
    height: '72px',
  },
  blockGreen: {
    backgroundColor: 'color-mix(in srgb, #3D9A6A 20%, white)',
    top: '20px',
    height: '40px',
  },
  blockAmber: {
    backgroundColor: 'color-mix(in srgb, #D89A2B 22%, white)',
    top: '12px',
    height: '56px',
  },

  // Staggered entrance — marketing, once
  enter: {
    opacity: 0,
    transform: 'translateY(10px)',
    animationName: stylex.keyframes({
      to: { opacity: 1, transform: 'translateY(0)' },
    }),
    animationDuration: '520ms',
    animationTimingFunction: easeOut,
    animationFillMode: 'forwards',
    [REDUCE]: {
      opacity: 1,
      transform: 'none',
      animationName: 'none',
    },
  },
  d1: { animationDelay: '40ms' },
  d2: { animationDelay: '100ms' },
  d3: { animationDelay: '160ms' },
  d4: { animationDelay: '220ms' },
  d5: { animationDelay: '280ms' },

  // —— Features ——
  features: {
    maxWidth: '1120px',
    marginInline: 'auto',
    paddingBlock: {
      default: '72px',
      [MOBILE]: '56px',
    },
    paddingInline: {
      default: '28px',
      [MOBILE]: '18px',
    },
  },

  sectionHead: {
    maxWidth: '420px',
    marginBottom: {
      default: '40px',
      [MOBILE]: '28px',
    },
  },

  sectionTitle: {
    margin: 0,
    fontSize: {
      default: '28px',
      [MOBILE]: '24px',
    },
    fontWeight: 650,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    textWrap: 'balance',
  },

  sectionCopy: {
    margin: 0,
    marginTop: '10px',
    fontSize: '14.5px',
    lineHeight: 1.55,
    color: colors.muted,
    textWrap: 'pretty',
  },

  featureList: {
    display: 'grid',
    gridTemplateColumns: {
      default: '1fr 1fr',
      [MOBILE]: '1fr',
    },
    gap: 0,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },

  feature: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingBlock: '22px',
    paddingInline: {
      default: '0 28px',
      [MOBILE]: '0',
    },
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
    transitionProperty: 'opacity, transform',
    transitionDuration: '180ms',
    transitionTimingFunction: easeOut,
  },

  featureOdd: {
    '@media screen and (min-width: 721px)': {
      paddingInline: '28px 0',
      borderLeftWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftColor: colors.line,
    },
  },

  featureLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 620,
    letterSpacing: '-0.015em',
    color: colors.ink,
  },

  featureDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: colors.ink,
    flexShrink: 0,
  },

  featureDotGuest: {
    backgroundColor: '#E96D4F',
  },

  featureDotLive: {
    backgroundColor: '#4E9EDB',
  },

  featureBody: {
    margin: 0,
    marginLeft: '15px',
    fontSize: '13.5px',
    lineHeight: 1.55,
    color: colors.muted,
    textWrap: 'pretty',
    maxWidth: '42ch',
  },

  // Guest auth spotlight — interactive demo strip
  guestDemo: {
    maxWidth: '1120px',
    marginInline: 'auto',
    paddingBlock: {
      default: '24px 88px',
      [MOBILE]: '12px 64px',
    },
    paddingInline: {
      default: '28px',
      [MOBILE]: '18px',
    },
  },

  guestPanel: {
    display: 'grid',
    gridTemplateColumns: {
      default: '1.1fr 0.9fr',
      [MOBILE]: '1fr',
    },
    gap: {
      default: '48px',
      [MOBILE]: '28px',
    },
    alignItems: 'center',
    paddingBlock: {
      default: '36px',
      [MOBILE]: '28px',
    },
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },

  guestKicker: {
    margin: 0,
    fontSize: '11px',
    fontWeight: 650,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.faint,
  },

  guestTitle: {
    margin: 0,
    marginTop: '10px',
    fontSize: {
      default: '26px',
      [MOBILE]: '22px',
    },
    fontWeight: 650,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    textWrap: 'balance',
  },

  guestBody: {
    margin: 0,
    marginTop: '12px',
    fontSize: '14.5px',
    lineHeight: 1.55,
    color: colors.muted,
    textWrap: 'pretty',
    maxWidth: '44ch',
  },

  guestActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '22px',
  },

  guestStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '20px',
    borderRadius: '16px',
    backgroundColor: colors.paper,
    boxShadow: `0 0 0 1px ${colors.edge}, 0 8px 28px -16px rgba(20,20,26,.35)`,
  },

  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },

  statusLabel: {
    fontSize: '12px',
    fontWeight: 550,
    color: colors.muted,
  },

  statusValue: {
    fontSize: '13px',
    fontWeight: 620,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
    color: colors.ink,
  },

  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    paddingBlock: '5px',
    paddingInline: '10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    backgroundColor: 'color-mix(in srgb, #E96D4F 14%, transparent)',
    color: '#B8472E',
  },

  pillDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#E96D4F',
  },

  statusHint: {
    margin: 0,
    fontSize: '12.5px',
    lineHeight: 1.5,
    color: colors.muted,
    textWrap: 'pretty',
  },

  footer: {
    maxWidth: '1120px',
    marginInline: 'auto',
    paddingBlock: '24px 40px',
    paddingInline: {
      default: '28px',
      [MOBILE]: '18px',
    },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    color: colors.faint,
    fontSize: '12px',
  },

  footerLink: {
    color: colors.muted,
    textDecoration: 'none',
    transitionProperty: 'color',
    transitionDuration: '150ms',
    transitionTimingFunction: easeOut,
    [HOVER]: {
      ':hover': { color: colors.ink },
    },
  },

  // Scroll reveal helper class toggled via data attribute
  reveal: {
    opacity: 0,
    transform: 'translateY(12px)',
    transitionProperty: 'opacity, transform',
    transitionDuration: '480ms',
    transitionTimingFunction: easeOut,
  },

  revealIn: {
    opacity: 1,
    transform: 'translateY(0)',
  },

  revealReduce: {
    [REDUCE]: {
      opacity: 1,
      transform: 'none',
      transitionDuration: '0ms',
    },
  },
});
