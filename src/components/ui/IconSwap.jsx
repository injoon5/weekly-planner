import * as stylex from '@stylexjs/stylex';

const s = stylex.create({
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  layer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: '.3s',
    transitionTimingFunction: 'cubic-bezier(.2,0,0,1)',
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0ms',
    },
  },

  overlay: {
    position: 'absolute',
    inset: 0,
  },

  shown: {
    opacity: 1,
    transform: 'scale(1)',
    filter: 'blur(0px)',
  },

  hiddenLayer: {
    opacity: 0,
    transform: 'scale(.25)',
    filter: 'blur(4px)',
  },
});

/**
 * Cross-fades two icons on a state change. Both stay mounted (one absolutely
 * positioned on top), so enter and exit both animate and stay interruptible.
 */
export function IconSwap({ active, activeIcon, inactiveIcon }) {
  return (
    <span {...stylex.props(s.wrap)} aria-hidden>
      <span {...stylex.props(s.layer, s.overlay, active ? s.shown : s.hiddenLayer)}>
        {activeIcon}
      </span>
      <span {...stylex.props(s.layer, active ? s.hiddenLayer : s.shown)}>{inactiveIcon}</span>
    </span>
  );
}
