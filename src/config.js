/** Single app id for the browser. Instant CLI reads the same value from `.env`. */
export const APP_ID = '957d09d1-44df-4541-8ebe-70ba7f1388c1';

export const THEME_KEY = 'weekly-planner.theme';
export const LEGACY_KEY = 'weekly-planner.v2';
export const LEGACY_KEY1 = 'weekly-planner.v1';

export const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const PALETTE = ['coral', 'amber', 'green', 'teal', 'sky', 'violet', 'pink', 'graphite'];

/** Fallback Korean labels when a board has no custom colorLabels. */
export const COLOR_LABELS_KO = {
  coral: '산호',
  amber: '호박',
  green: '초록',
  teal: '청록',
  sky: '하늘',
  violet: '보라',
  pink: '분홍',
  graphite: '회색',
};

export const SLOTS = 48;
export const SLOT_MIN = 30;
export const DAY_MIN = SLOTS * SLOT_MIN; // 1440
/** Grid starts at 06:00 local time. */
export const DAY_ORIGIN = 360;
