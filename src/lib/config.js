/**
 * Instant app id for the browser. Set `VITE_INSTANT_APP_ID` in `.env`
 * (same value as `INSTANT_APP_ID` used by CLI + serverless).
 */
const envAppId = import.meta.env.VITE_INSTANT_APP_ID;
if (!envAppId || typeof envAppId !== 'string') {
  throw new Error(
    'Missing VITE_INSTANT_APP_ID — copy .env.example to .env and set the Instant app id',
  );
}
export const APP_ID = envAppId;

/** Public docs site (Fumadocs). */
export const DOCS_URL = 'https://docs.plan.ij5.dev';

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
/** Minutes and slots from the grid origin until the next midnight. */
export const NEXT_DAY_START_MIN = DAY_MIN - DAY_ORIGIN;
export const NEXT_DAY_START_SLOT = NEXT_DAY_START_MIN / SLOT_MIN;

/** Dialog vs drawer breakpoint — keep in sync with editor.dlg mobile styles. */
export const MOBILE_SHEET_BP = 560;
export const MOBILE_SHEET_MQ = `(max-width: ${MOBILE_SHEET_BP}px)`;
