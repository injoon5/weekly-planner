/**
 * Pure helpers for Open Graph / Twitter cards.
 * Used by /api/share-meta (bots), /api/og, and unit tests — no Instant / Node APIs.
 */

export const DEFAULT_OG_TITLE = '주간 계획표 · Weekly Planner';
export const DEFAULT_OG_DESCRIPTION = '실시간으로 함께 쓰는 주간 시간표';
export const DEFAULT_OG_IMAGE_TITLE = '주간 계획표';

/** Social / unfurler user-agents (Kakao, Discord, Slack, Meta, X, …). */
export const SOCIAL_CRAWLER_RE =
  /bot|crawl|slurp|spider|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|skypeuripreview|vkshare|pinterest|redditbot|applebot|googlebot|bingbot|duckduckbot|baiduspider|yandexbot|kakaotalk|kakao|embedly|quora link preview|showyoubot|outbrain|opengraph|iframely|semrush|ahrefs|petalbot|bytespider/i;

/** OG mini-grid window: Mon–Fri columns, clock 09:00–15:00. */
export const OG_DAY_ORIGIN = 360;
export const OG_WIN_START = 180; // 09:00 as minutes-from-06:00
export const OG_WIN_END = 540; // 15:00
export const OG_MAX_EVENTS = 30;
export const OG_EVENT_TITLE_MAX = 40;
export const OG_OWNER_MAX = 20;

const PALETTE = new Set(['coral', 'amber', 'green', 'teal', 'sky', 'violet', 'pink', 'graphite']);

export function isSocialCrawler(userAgent) {
  return SOCIAL_CRAWLER_RE.test(userAgent || '');
}

function clipWithEllipsis(clean, max) {
  if (clean.length <= max) return clean;
  // Keep room for the ellipsis so the visible cap stays at `max`.
  return `${clean.slice(0, Math.max(0, max - 1))}…`;
}

/** Strip control chars and cap length for OG image titles. */
export function sanitizeOgImageTitle(raw, fallback = DEFAULT_OG_IMAGE_TITLE) {
  // eslint-disable-next-line no-control-regex
  const clean = String(raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
  return clean ? clipWithEllipsis(clean, 24) : fallback;
}

/** Public owner label — never a raw email. */
export function sanitizeOgOwner(raw) {
  // eslint-disable-next-line no-control-regex
  const clean = String(raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
  if (!clean) return '';
  const local = clean.includes('@') ? clean.split('@')[0] : clean;
  return clipWithEllipsis(local, OG_OWNER_MAX);
}

/**
 * Resolve a short owner label from Instant `$users` + optional `settings`.
 * Prefer displayName; fall back to email local-part. Never returns an email.
 */
export function ownerLabelFrom(owner) {
  if (!owner || typeof owner !== 'object') return '';
  const settings = owner.settings;
  const custom =
    settings && typeof settings === 'object' && !Array.isArray(settings)
      ? settings.displayName
      : Array.isArray(settings)
        ? settings[0]?.displayName
        : '';
  if (typeof custom === 'string' && custom.trim()) return sanitizeOgOwner(custom);
  if (typeof owner.email === 'string' && owner.email.trim()) return sanitizeOgOwner(owner.email);
  return '';
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clampInt(n, lo, hi, fallback) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, v));
}

function normalizeOgEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const day = clampInt(raw.day, 0, 6, NaN);
  const start = clampInt(raw.start, 0, 1440, NaN);
  const dur = clampInt(raw.dur, 30, 1440, NaN);
  if (!Number.isFinite(day) || !Number.isFinite(start) || !Number.isFinite(dur)) return null;
  const color = PALETTE.has(raw.color) ? raw.color : 'sky';
  // eslint-disable-next-line no-control-regex
  const title = String(raw.title || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, OG_EVENT_TITLE_MAX);
  return { day, start, dur, color, title: title || '일정' };
}

/**
 * Pick Mon–Fri events that intersect the OG visible window (09:00–15:00).
 * Sorted by day then start; capped at OG_MAX_EVENTS.
 */
export function pickOgEvents(events) {
  const list = Array.isArray(events) ? events : [];
  const scored = [];
  for (const raw of list) {
    const e = normalizeOgEvent(raw);
    if (!e) continue;
    // OG card columns are Mon–Fri only (day 1–5).
    if (e.day < 1 || e.day > 5) continue;
    const end = e.start + e.dur;
    if (end <= OG_WIN_START || e.start >= OG_WIN_END) continue;
    const clippedStart = Math.max(e.start, OG_WIN_START);
    const clippedEnd = Math.min(end, OG_WIN_END);
    const clippedDur = clippedEnd - clippedStart;
    if (clippedDur < 30) continue;
    scored.push({
      day: e.day,
      start: clippedStart,
      dur: clippedDur,
      color: e.color,
      title: e.title,
    });
  }
  scored.sort((a, b) => a.day - b.day || a.start - b.start);
  return scored.slice(0, OG_MAX_EVENTS);
}

/** Compact base64url payload for `/api/og?e=…`. */
export function encodeOgEvents(events) {
  const payload = pickOgEvents(events).map((e) => [e.day, e.start, e.dur, e.color, e.title]);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }
  // Browser / edge fallback
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Decode `e` query param → event list. Invalid input → []. */
export function decodeOgEvents(raw) {
  if (raw == null || raw === '') return [];
  try {
    let json;
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(String(raw), 'base64url').toString('utf8');
    } else {
      const b64 = String(raw).replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 === 0 ? b64 : b64 + '='.repeat(4 - (b64.length % 4));
      json = atob(pad);
    }
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return pickOgEvents(
      parsed.map((row) => {
        if (Array.isArray(row)) {
          const [day, start, dur, color, title] = row;
          return { day, start, dur, color, title };
        }
        return row;
      }),
    );
  } catch {
    return [];
  }
}

/**
 * Build `/api/og` query string from a resolved card.
 * Open shares always include `e` (even when empty) so the image can skip the demo grid.
 */
export function buildOgImageSearchParams(card) {
  const params = new URLSearchParams();
  params.set('title', card.imageTitle || DEFAULT_OG_IMAGE_TITLE);
  if (card.owner) params.set('owner', card.owner);
  if (typeof card.eventCount === 'number' && card.eventCount > 0) {
    params.set('n', String(Math.min(999, Math.round(card.eventCount))));
  }
  if (card.useRealSchedule) {
    params.set('e', encodeOgEvents(card.events || []));
  }
  if (card.locked) params.set('locked', '1');
  return params;
}

export function buildOgImageUrl(origin, card) {
  const q = buildOgImageSearchParams(card).toString();
  return `${origin}/api/og?${q}`;
}

/**
 * Left-column subtitle for the OG image (same muted slot as the product tagline).
 * Returns a pre-line string; empty means “use the default product tagline”.
 */
export function ogImageSubtitle({ owner, eventCount } = {}) {
  const who = sanitizeOgOwner(owner);
  const n = Math.round(Number(eventCount)) || 0;
  if (who && n > 0) return `${who} · ${n}개 일정`;
  if (who) return `${who}의 시간표`;
  if (n > 0) return `${n}개 일정`;
  return '';
}

/**
 * Map Instant share + board (+ owner/events) → public card fields.
 * Password / disabled / missing shares stay generic so names & schedules don't leak.
 */
export function resolveShareOgCard(share, board, extras = {}) {
  const blank = {
    title: DEFAULT_OG_TITLE,
    description: DEFAULT_OG_DESCRIPTION,
    imageTitle: DEFAULT_OG_IMAGE_TITLE,
    owner: '',
    eventCount: 0,
    events: [],
    useRealSchedule: false,
    locked: false,
  };

  if (!share?.enabled) return blank;

  if (share.mode === 'password') {
    return {
      ...blank,
      title: '공유된 주간 계획표',
      description: '비밀번호가 필요한 공유 시간표예요',
      // Demo grid stays under a thick blur + lock — never leak real data.
      locked: true,
    };
  }

  const name = typeof board?.name === 'string' ? board.name.trim() : '';
  if (!name) return blank;

  const owner = sanitizeOgOwner(extras.owner || ownerLabelFrom(board?.owner) || '');
  const allEvents = Array.isArray(extras.events)
    ? extras.events
    : Array.isArray(board?.events)
      ? board.events
      : [];
  const events = pickOgEvents(allEvents);
  const eventCount = allEvents.length;

  const bits = [];
  if (owner) bits.push(`${owner}님의 주간 시간표`);
  else bits.push(DEFAULT_OG_DESCRIPTION);
  if (eventCount > 0) bits.push(`${eventCount}개 일정`);

  return {
    title: `${name} · 주간 계획표`,
    description: bits.join(' · '),
    imageTitle: sanitizeOgImageTitle(name),
    owner,
    eventCount,
    events,
    useRealSchedule: true,
    locked: false,
  };
}

/**
 * Minimal HTML document for crawlers. Humans never see this — middleware
 * only rewrites bot requests to /api/share-meta.
 */
export function renderShareOgHtml({
  title,
  description,
  url,
  imageUrl,
  imageAlt = '주간 계획표 주간 시간표 미리보기',
}) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(url);
  const img = escapeHtml(imageUrl);
  const alt = escapeHtml(imageAlt);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${u}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${alt}">
<meta property="og:image:type" content="image/png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${img}">
</head>
<body>
<a href="${u}">${t}</a>
</body>
</html>`;
}
