/**
 * Shared breakpoint strings — copy the same literals into each `stylex.create`
 * module (StyleX 0.19 cannot import plain constants into `create()` keys).
 * Keep numeric BPs aligned with `src/lib/config.js` (`MOBILE_SHEET_BP` = 560).
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

/** Numeric companions for JS matchMedia / layout (not for StyleX create keys). */
export const BREAKPOINT_PX = {
  mobile: 720,
  sheet: 560,
  landingNarrow: 760,
  landingTight: 460,
};
