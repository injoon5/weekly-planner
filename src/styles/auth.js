import * as stylex from '@stylexjs/stylex';
import { colors, layout } from '../tokens.stylex.js';

export const auth = stylex.create({
  root: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: '24px',
    paddingInline: '16px',
    backgroundImage: `radial-gradient(1200px 600px at 12% -10%, color-mix(in srgb, #E96D4F 14%, transparent), transparent 60%), radial-gradient(900px 500px at 100% 0%, color-mix(in srgb, #4E9EDB 12%, transparent), transparent 55%)`,
    backgroundColor: colors.bg,
  },
  card: {
    width: 'min(380px, 100%)',
    backgroundColor: colors.paper,
    borderRadius: '16px',
    paddingTop: '28px',
    paddingBottom: '24px',
    paddingInline: '24px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 12px rgba(20,20,26,.06), 0 24px 48px -20px rgba(20,20,26,.28)`,
  },
  mark: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: colors.ink,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3px',
    padding: '8px',
    marginBottom: '18px',
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
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 650,
    letterSpacing: '-0.02em',
    color: colors.ink,
    fontFamily: layout.font,
  },
  copy: {
    marginTop: '8px',
    marginBottom: '18px',
    color: colors.muted,
    fontSize: '13.5px',
    lineHeight: 1.5,
  },
  err: {
    marginBottom: '12px',
    paddingBlock: '8px',
    paddingInline: '10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(229,72,77,.10)',
    color: colors.now,
    fontSize: '12.5px',
    fontWeight: 550,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  back: {
    marginTop: '10px',
    width: '100%',
    justifyContent: 'center',
  },
  otp: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
  },
  otpShake: {
    animationName: stylex.keyframes({
      '0%, 100%': { transform: 'translateX(0)' },
      '20%': { transform: 'translateX(-4px)' },
      '40%': { transform: 'translateX(4px)' },
      '60%': { transform: 'translateX(-3px)' },
      '80%': { transform: 'translateX(3px)' },
    }),
    animationDuration: '320ms',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
  },

  stepEnter: {
    animationName: stylex.keyframes({
      from: { opacity: 0, transform: 'translateY(8px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    }),
    animationDuration: '.28s',
    animationTimingFunction: 'cubic-bezier(.23,1,.32,1)',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
    },
  },

  formPrimary: {
    justifyContent: 'center',
    paddingBlock: '11px',
    paddingInline: '14px',
    fontSize: '13.5px',
  },

  otpCell: {
    width: '44px',
    height: '48px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    borderWidth: 0,
    borderRadius: '10px',
    backgroundColor: colors.field,
    color: colors.ink,
    fontFamily: 'inherit',
    outline: 'none',
    // Order matters: CodeInputs staggers the opacity/transform entrance with a
    // per-cell inline transitionDelay list matching these five properties.
    transitionProperty: 'background-color, border-color, box-shadow, opacity, transform',
    transitionDuration: '.3s',
    transitionTimingFunction: 'cubic-bezier(.2,0,0,1)',
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0ms',
    },
    ':focus': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 4px ${colors.ink}`,
    },
    ':disabled': { opacity: 0.55 },
  },
});
