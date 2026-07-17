/**
 * Shared StyleX media-query strings (copy into each `stylex.create` module).
 * StyleX 0.19 + unplugin cannot import plain constants into `create()` keys,
 * and `defineConsts` media keys currently fail the build — keep literals local.
 */
export const BREAKPOINTS = {
  mobile720: '@media screen and (max-width: 720px)',
  sheet560: '@media screen and (max-width: 560px)',
  landingNarrow: '@media (max-width: 760px)',
  landingTight: '@media (max-width: 460px)',
  print: '@media print',
  coarse: '@media (pointer: coarse)',
  reduceMotion: '@media (prefers-reduced-motion: reduce)',
  reduceTransparency: '@media (prefers-reduced-transparency: reduce)',
};
