import * as stylex from '@stylexjs/stylex';
import { colors, layout } from '../tokens.stylex.js';

// Strong ease-out (starts fast → responsive entrances). Matches the auth card.
const EASE_OUT = 'cubic-bezier(.23,1,.32,1)';
const CORAL = '#E96D4F';
const BLUE = '#4E9EDB';
const REDUCE = '@media (prefers-reduced-motion: reduce)';
const NARROW = '@media (max-width: 760px)';
const TIGHT = '@media (max-width: 460px)';

// One shared rise-in keyframe; each element sets its own animationDelay inline
// so the hero staggers in. Nothing appears from nothing — we fade + lift, never
// scale from zero.
const rise = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(12px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const floatY = stylex.keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-6px)' },
});

export const landing = stylex.create({
  page: {
    minHeight: '100dvh',
    color: colors.ink,
    fontFamily: layout.font,
    // Soft twin-accent wash, anchored top corners — same hues as the auth mark,
    // faint enough to survive both themes.
    backgroundColor: colors.bg,
    backgroundImage: `radial-gradient(1100px 560px at 8% -8%, color-mix(in srgb, ${CORAL} 13%, transparent), transparent 58%), radial-gradient(900px 520px at 100% -4%, color-mix(in srgb, ${BLUE} 12%, transparent), transparent 55%)`,
    backgroundRepeat: 'no-repeat',
    overflowX: 'hidden',
    // Korean line-breaking: break between words (eojeol), never mid-word.
    wordBreak: 'keep-all',
  },

  // ── Nav ────────────────────────────────────────────────────────────────
  // Full-bleed sticky band; frosts + grows a hairline border once scrolled.
  navBand: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '220ms',
    transitionTimingFunction: 'ease',
  },
  navScrolled: {
    backgroundColor: colors.glass,
    borderBottomColor: colors.line,
    backdropFilter: 'saturate(1.4) blur(12px)',
    WebkitBackdropFilter: 'saturate(1.4) blur(12px)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    height: '60px',
    paddingInline: 'clamp(16px, 5vw, 40px)',
    maxWidth: '1080px',
    marginInline: 'auto',
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    fontSize: '14.5px',
    fontWeight: 640,
    letterSpacing: '-0.015em',
    color: colors.ink,
  },
  navRight: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },

  // Brand mark — the two-tone tile from the auth screen, reused for continuity.
  mark: {
    width: '26px',
    height: '26px',
    borderRadius: '8px',
    backgroundColor: colors.ink,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2.5px',
    padding: '6px',
    flexShrink: 0,
  },
  markLg: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    padding: '9px',
    gap: '3.5px',
  },
  markA: {
    borderRadius: '2.5px',
    backgroundColor: CORAL,
    alignSelf: 'end',
    height: '9px',
  },
  markB: {
    borderRadius: '2.5px',
    backgroundColor: BLUE,
    alignSelf: 'start',
    height: '8px',
  },

  // ── Layout shell ───────────────────────────────────────────────────────
  shell: {
    maxWidth: '1080px',
    marginInline: 'auto',
    paddingInline: 'clamp(16px, 5vw, 40px)',
  },

  // ── Hero ───────────────────────────────────────────────────────────────
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
    gap: 'clamp(28px, 5vw, 64px)',
    alignItems: 'center',
    paddingTop: 'clamp(48px, 9vw, 104px)',
    paddingBottom: 'clamp(48px, 8vw, 92px)',
    [NARROW]: {
      gridTemplateColumns: '1fr',
      gap: '40px',
      paddingTop: '40px',
    },
  },
  heroCopy: {
    maxWidth: '38ch',
    [NARROW]: { maxWidth: 'none' },
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    height: '27px',
    paddingInline: '11px',
    borderRadius: '99px',
    backgroundColor: colors.paper,
    boxShadow: `inset 0 0 0 1px ${colors.edge}`,
    color: colors.muted,
    fontSize: '12px',
    fontWeight: 560,
    letterSpacing: '-0.002em',
    marginBottom: '20px',
  },
  eyebrowDot: {
    width: '6px',
    height: '6px',
    borderRadius: '99px',
    backgroundColor: '#3BB273',
    boxShadow: '0 0 0 3px color-mix(in srgb, #3BB273 24%, transparent)',
  },
  h1: {
    margin: 0,
    fontSize: 'clamp(38px, 6.4vw, 64px)',
    lineHeight: 1.04,
    letterSpacing: '-0.035em',
    fontWeight: 720,
    color: colors.ink,
    textWrap: 'balance',
  },
  h1Accent: {
    // Gradient ink for the second line — coral→blue, the product's two hues.
    backgroundImage: `linear-gradient(105deg, ${CORAL}, ${BLUE})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  },
  lede: {
    marginTop: '20px',
    marginBottom: 0,
    fontSize: 'clamp(15px, 1.7vw, 17.5px)',
    lineHeight: 1.6,
    color: colors.muted,
    textWrap: 'pretty',
  },
  ctaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px',
    marginTop: '30px',
  },
  ctaNote: {
    marginTop: '16px',
    fontSize: '12.5px',
    lineHeight: 1.5,
    color: colors.faint,
    textWrap: 'pretty',
  },

  // ── Buttons ────────────────────────────────────────────────────────────
  // Buttons reuse the app's `ui.btn` variants; this only scales them up for the
  // hero + spotlight so they read at landing size while keeping app behavior.
  ctaSize: {
    paddingBlock: '11px',
    paddingInline: '18px',
    fontSize: '14px',
    borderRadius: '11px',
  },
  btnArrow: {
    transitionProperty: 'transform',
    transitionDuration: '200ms',
    transitionTimingFunction: EASE_OUT,
  },

  // ── Hero preview card (mini planner) ──────────────────────────────────
  previewWrap: {
    position: 'relative',
    perspective: '1200px',
    [NARROW]: { order: -1 },
  },
  preview: {
    borderRadius: '18px',
    backgroundColor: colors.paper,
    boxShadow: `0 0 0 1px ${colors.edge}, 0 2px 6px rgba(20,20,26,.05), 0 40px 80px -40px rgba(20,20,26,.4)`,
    overflow: 'hidden',
    animationName: floatY,
    animationDuration: '7s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    [REDUCE]: { animationName: 'none' },
  },
  previewBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    height: '38px',
    paddingInline: '14px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  dot: { width: '9px', height: '9px', borderRadius: '99px' },
  previewTitle: {
    marginLeft: '6px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: colors.muted,
    letterSpacing: '-0.005em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '30px repeat(5, 1fr)',
    paddingInline: '12px',
    paddingBottom: '14px',
    paddingTop: '4px',
  },
  gHead: {
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10.5px',
    fontWeight: 600,
    color: colors.faint,
    fontVariantNumeric: 'tabular-nums',
  },
  gCol: {
    position: 'relative',
    height: '188px',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: colors.line,
  },
  gGut: { position: 'relative', height: '188px' },
  gTime: {
    position: 'absolute',
    right: '6px',
    fontSize: '9px',
    fontWeight: 550,
    color: colors.faint,
    fontVariantNumeric: 'tabular-nums',
    transform: 'translateY(-50%)',
  },
  gLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: colors.gridHour,
  },
  block: {
    position: 'absolute',
    left: '4px',
    right: '4px',
    borderRadius: '6px',
    padding: '5px 7px',
    backgroundColor: 'var(--ev-bg)',
    color: 'var(--ev-fg)',
    boxShadow: 'inset 3px 0 0 var(--ev-accent)',
    overflow: 'hidden',
  },
  blockT: {
    fontSize: '9.5px',
    fontWeight: 640,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  blockS: {
    marginTop: '1px',
    fontSize: '8.5px',
    fontWeight: 550,
    opacity: 0.75,
    fontVariantNumeric: 'tabular-nums',
  },
  // Floating presence avatars over the preview — hints at real-time collab.
  presence: {
    position: 'absolute',
    top: '-14px',
    right: '18px',
    display: 'inline-flex',
    paddingBlock: '5px',
    paddingInline: '9px 11px',
    borderRadius: '99px',
    backgroundColor: colors.paper,
    boxShadow: `0 0 0 1px ${colors.edge}, 0 10px 24px -12px rgba(20,20,26,.4)`,
    alignItems: 'center',
    gap: '7px',
    [TIGHT]: { display: 'none' },
  },
  avatars: { display: 'inline-flex' },
  avatar: {
    width: '20px',
    height: '20px',
    borderRadius: '99px',
    marginLeft: '-6px',
    boxShadow: `0 0 0 2px ${colors.paper}`,
    display: 'grid',
    placeItems: 'center',
    fontSize: '9px',
    fontWeight: 700,
    color: '#fff',
  },
  presenceTxt: { fontSize: '10.5px', fontWeight: 560, color: colors.muted },

  // ── Section scaffolding ────────────────────────────────────────────────
  section: {
    paddingBlock: 'clamp(56px, 9vw, 104px)',
  },
  sectionHead: {
    maxWidth: '30ch',
    marginBottom: 'clamp(32px, 5vw, 52px)',
  },
  kicker: {
    fontSize: '12.5px',
    fontWeight: 640,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: CORAL,
    marginBottom: '12px',
  },
  h2: {
    margin: 0,
    fontSize: 'clamp(26px, 4vw, 38px)',
    lineHeight: 1.1,
    letterSpacing: '-0.028em',
    fontWeight: 680,
    color: colors.ink,
    textWrap: 'balance',
  },
  sectionSub: {
    marginTop: '16px',
    marginBottom: 0,
    fontSize: 'clamp(14.5px, 1.6vw, 16px)',
    lineHeight: 1.6,
    color: colors.muted,
    textWrap: 'pretty',
  },

  // ── Feature grid ───────────────────────────────────────────────────────
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '14px',
    [NARROW]: { gridTemplateColumns: 'repeat(2, 1fr)' },
    [TIGHT]: { gridTemplateColumns: '1fr' },
  },
  card: {
    position: 'relative',
    padding: '22px 20px 24px',
    borderRadius: '16px',
    backgroundColor: colors.paper,
    boxShadow: `inset 0 0 0 1px ${colors.edge}`,
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '220ms',
    transitionTimingFunction: EASE_OUT,
    ':hover': {
      transform: 'translateY(-3px)',
      boxShadow: `inset 0 0 0 1px ${colors.edgeH}, 0 2px 4px rgba(20,20,26,.04), 0 18px 36px -20px rgba(20,20,26,.32)`,
    },
    [REDUCE]: { transitionDuration: '0ms', ':hover': { transform: 'none' } },
  },
  cardIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    marginBottom: '15px',
    color: colors.ink,
    backgroundColor: colors.field,
    boxShadow: `inset 0 0 0 1px ${colors.edge}`,
  },
  cardTitle: {
    margin: 0,
    fontSize: '15.5px',
    fontWeight: 640,
    letterSpacing: '-0.012em',
    color: colors.ink,
  },
  cardBody: {
    marginTop: '7px',
    marginBottom: 0,
    fontSize: '13.5px',
    lineHeight: 1.58,
    color: colors.muted,
    textWrap: 'pretty',
  },

  // ── Guest spotlight ────────────────────────────────────────────────────
  guest: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '22px',
    paddingBlock: 'clamp(40px, 6vw, 60px)',
    paddingInline: 'clamp(24px, 5vw, 56px)',
    backgroundColor: colors.paper,
    boxShadow: `inset 0 0 0 1px ${colors.edge}`,
    backgroundImage: `radial-gradient(720px 300px at 88% -20%, color-mix(in srgb, ${BLUE} 14%, transparent), transparent 60%), radial-gradient(560px 260px at 4% 120%, color-mix(in srgb, ${CORAL} 12%, transparent), transparent 62%)`,
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 'clamp(28px, 5vw, 56px)',
    alignItems: 'center',
    [NARROW]: { gridTemplateColumns: '1fr' },
  },
  guestCopy: { maxWidth: '46ch' },
  guestSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '236px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    [NARROW]: { minWidth: 0 },
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '13px',
    padding: '12px 4px',
  },
  stepNum: {
    flexShrink: 0,
    width: '26px',
    height: '26px',
    borderRadius: '99px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '12px',
    fontWeight: 680,
    fontVariantNumeric: 'tabular-nums',
    color: colors.onInk,
    backgroundColor: colors.ink,
  },
  stepTitle: {
    fontSize: '13.5px',
    fontWeight: 620,
    color: colors.ink,
    letterSpacing: '-0.008em',
  },
  stepBody: {
    marginTop: '2px',
    fontSize: '12.5px',
    lineHeight: 1.5,
    color: colors.muted,
    textWrap: 'pretty',
  },
  stepConnector: {
    width: '1.5px',
    height: '10px',
    marginLeft: '17px',
    backgroundColor: colors.line,
  },
  guestCta: { marginTop: '28px', display: 'flex', flexWrap: 'wrap', gap: '10px' },

  // ── Footer ─────────────────────────────────────────────────────────────
  footer: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    marginTop: 'clamp(40px, 6vw, 72px)',
  },
  footerInner: {
    maxWidth: '1080px',
    marginInline: 'auto',
    paddingInline: 'clamp(16px, 5vw, 40px)',
    paddingBlock: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  footerTxt: { fontSize: '12.5px', color: colors.faint, fontWeight: 500 },

  // ── Entrance stagger ───────────────────────────────────────────────────
  rise: {
    animationName: rise,
    animationDuration: '640ms',
    animationTimingFunction: EASE_OUT,
    animationFillMode: 'both',
    [REDUCE]: { animationName: 'none' },
  },
});
