import * as stylex from '@stylexjs/stylex';

const MOBILE = '@media (max-width: 720px)';

export const colors = stylex.defineVars({
  bg: '#F6F6F7',
  paper: '#FFFFFF',
  ink: '#1B1B20',
  onInk: '#FFFFFF',
  muted: '#6E6E76',
  faint: '#9A9AA2',
  line: '#E9E9EC',
  gridHour: 'rgba(24,24,28,.075)',
  gridHalf: 'rgba(24,24,28,.035)',
  hov: 'rgba(27,27,32,.05)',
  edge: 'rgba(27,27,32,.10)',
  edgeH: 'rgba(27,27,32,.16)',
  field: '#F3F3F5',
  fieldH: '#EEEEF1',
  glass: 'rgba(255,255,255,.84)',
  glass2: 'rgba(255,255,255,.78)',
  glass3: 'rgba(252,252,253,.82)',
  scrim: 'rgba(18,18,22,.34)',
  sel: '#DCE7F8',
  chipBg: '#232328',
  chipFg: '#FFFFFF',
  now: '#E5484D',
  nowHalo: 'rgba(255,255,255,.85)',
  sun: '#D5504A',
  sat: '#4577C9',
  sb: 'rgba(27,27,32,.18)',
  sbH: 'rgba(27,27,32,.30)',
});

export const layout = stylex.defineVars({
  slotH: { default: '28px', [MOBILE]: '26px' },
  headH: { default: '46px', [MOBILE]: '42px' },
  gutW: { default: '54px', [MOBILE]: '46px' },
  colMin: { default: '116px', [MOBILE]: '106px' },
  font:
    '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
});
