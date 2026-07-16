/**
 * Pure helpers for Open Graph / Twitter cards.
 * Used by /api/share-meta (bots) and unit tests — no Instant / Node APIs.
 */

export const DEFAULT_OG_TITLE = '주간 계획표 · Weekly Planner';
export const DEFAULT_OG_DESCRIPTION = '실시간으로 함께 쓰는 주간 시간표';
export const DEFAULT_OG_IMAGE_TITLE = '주간 계획표';

/** Social / unfurler user-agents (Kakao, Discord, Slack, Meta, X, …). */
export const SOCIAL_CRAWLER_RE =
  /bot|crawl|slurp|spider|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|skypeuripreview|vkshare|pinterest|redditbot|applebot|googlebot|bingbot|duckduckbot|baiduspider|yandexbot|kakaotalk|kakao|embedly|quora link preview|showyoubot|outbrain|opengraph|iframely|semrush|ahrefs|petalbot|bytespider/i;

export function isSocialCrawler(userAgent) {
  return SOCIAL_CRAWLER_RE.test(userAgent || '');
}

/** Strip control chars and cap length for OG image titles. */
export function sanitizeOgImageTitle(raw, fallback = DEFAULT_OG_IMAGE_TITLE) {
  // eslint-disable-next-line no-control-regex
  const clean = String(raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
  return clean ? clean.slice(0, 24) : fallback;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Map Instant share + board → public card fields.
 * Password / disabled / missing shares stay generic so names don't leak.
 */
export function resolveShareOgCard(share, board) {
  if (!share?.enabled) {
    return {
      title: DEFAULT_OG_TITLE,
      description: DEFAULT_OG_DESCRIPTION,
      imageTitle: DEFAULT_OG_IMAGE_TITLE,
    };
  }

  if (share.mode === 'password') {
    return {
      title: '공유된 주간 계획표',
      description: '비밀번호가 필요한 공유 시간표예요',
      imageTitle: DEFAULT_OG_IMAGE_TITLE,
    };
  }

  const name = typeof board?.name === 'string' ? board.name.trim() : '';
  if (!name) {
    return {
      title: DEFAULT_OG_TITLE,
      description: DEFAULT_OG_DESCRIPTION,
      imageTitle: DEFAULT_OG_IMAGE_TITLE,
    };
  }

  return {
    title: `${name} · 주간 계획표`,
    description: DEFAULT_OG_DESCRIPTION,
    imageTitle: sanitizeOgImageTitle(name),
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
