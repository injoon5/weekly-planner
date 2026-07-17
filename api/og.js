import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from '@vercel/og';
import { sanitizeOgImageTitle } from '../src/server/og-meta.js';

const fontDir = join(dirname(fileURLToPath(import.meta.url)), 'fonts');

/**
 * Open Graph share card (1200×630), rendered on demand with @vercel/og
 * (Satori). Mirrors the app's light theme: the login mark and brand tints,
 * Pretendard, and a cropped week-grid card built from the real design tokens
 * (src/tokens.stylex.js, src/styles/palette.css).
 *
 * GET /api/og            → default card
 * GET /api/og?title=이름  → board-specific card (title capped at 24 chars)
 *
 * Node runtime + req/res handler: Vite API routes on Vercel use the Node
 * serverless shape. Returning ImageResponse without writing to `res` leaves
 * the connection open until the proxy times out (524).
 */
export const config = {
  runtime: 'nodejs',
};

// Satori supports woff but not woff2; bundled under api/fonts, loaded once per instance.
let fontsPromise;

function loadFonts() {
  fontsPromise ??= Promise.all(
    [
      ['Medium', 500],
      ['SemiBold', 600],
      ['Bold', 700],
    ].map(async ([name, weight]) => ({
      name: 'Pretendard',
      weight,
      style: 'normal',
      data: await readFile(join(fontDir, `Pretendard-${name}.woff`)),
    })),
  );
  return fontsPromise;
}

// Light-theme tokens. color-mix() isn't in Satori's CSS subset, so the
// derived tints/rings are precomputed rgba values.
const T = {
  bg: '#F6F6F7',
  paper: '#FFFFFF',
  ink: '#1B1B20',
  muted: '#6E6E76',
  faint: '#7C7C84',
  line: '#E9E9EC',
  gridHour: 'rgba(24,24,28,.075)',
  now: '#E5484D',
  markA: '#E96D4F',
  markB: '#4E9EDB',
};
const EV = {
  coral: ['#ffe3dd', '#a13a28', 'rgba(233,109,79,'],
  amber: ['#ffebc6', '#8a5a06', 'rgba(230,162,60,'],
  green: ['#d9f0db', '#22683a', 'rgba(83,174,110,'],
  sky: ['#d8ebfa', '#175e92', 'rgba(78,158,219,'],
  violet: ['#e6e2fa', '#4a3ea8', 'rgba(133,120,222,'],
};

// Mini week grid: 5 day columns, hour rows 9:00–14:00, ~1.6× app metrics.
const GUT = 78;
const COL = 128;
const ROW = 86;
const HEAD = 64;
const PAD = 26; // clears the header border so the first hour label sits below it
const CARD_W = GUT + 5 * COL;
const day = (d) => GUT + d * COL;
const y = (h, m = 0) => HEAD + PAD + (h - 9 + m / 60) * ROW;

// Satori accepts plain React-shaped element objects; a tiny helper keeps this
// file dependency-free instead of pulling in a JSX transform.
const h = (type, style, ...children) => ({
  type,
  props: { style, children: children.length > 1 ? children : children[0] },
});
const abs = (style, ...children) =>
  h('div', { position: 'absolute', display: 'flex', ...style }, ...children);

const block = (d, h1, m1, h2, m2, color, title) => {
  const [bg, fg, accent] = EV[color];
  const dur = h2 - h1 + (m2 - m1) / 60;
  return abs(
    {
      flexDirection: 'column',
      left: day(d) + 5,
      top: y(h1, m1) + 2,
      width: COL - 10,
      height: dur * ROW - 4,
      backgroundColor: bg,
      color: fg,
      borderRadius: 10,
      borderWidth: 1.5,
      borderStyle: 'solid',
      borderColor: `${accent}0.22)`,
      padding: '7px 10px 7px 17px',
      overflow: 'hidden',
    },
    abs({ left: 4, top: 4, bottom: 4, width: 5, borderRadius: 99, backgroundColor: `${accent}1)` }),
    h('div', { fontSize: 18, fontWeight: 600, letterSpacing: -0.07, lineHeight: 1.25, whiteSpace: 'nowrap' }, title),
    h(
      'div',
      { marginTop: 2, fontSize: 15, fontWeight: 500, opacity: 0.72, letterSpacing: 0.18 },
      `${h1}:${String(m1).padStart(2, '0')} – ${h2}:${String(m2).padStart(2, '0')}`,
    ),
  );
};

const card = () =>
  abs(
    {
      left: 538,
      top: 74,
      width: CARD_W,
      height: 640,
      backgroundColor: T.paper,
      borderRadius: 20,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: T.line,
      boxShadow: '0 24px 48px rgba(20,20,26,.18)',
      overflow: 'hidden',
    },
    // day headers
    ...['월', '화', '수', '목', '금'].map((d, i) =>
      abs(
        {
          left: day(i),
          top: 0,
          width: COL,
          height: HEAD,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 21,
          fontWeight: 600,
        },
        i === 2
          ? h(
              'div',
              {
                display: 'flex',
                width: 38,
                height: 38,
                borderRadius: 99,
                backgroundColor: T.ink,
                color: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              },
              d,
            )
          : d,
      ),
    ),
    abs({ left: 0, right: 0, top: HEAD, height: 1, backgroundColor: T.line }),
    abs({ left: GUT, top: 0, bottom: 0, width: 1, backgroundColor: T.line }),
    // hour lines + gutter times
    ...[9, 10, 11, 12, 13, 14, 15].flatMap((hr) => [
      abs({ left: GUT, right: 0, top: y(hr), height: 1, backgroundColor: T.gridHour }),
      abs(
        {
          left: 0,
          width: GUT - 12,
          top: y(hr) - 10,
          justifyContent: 'flex-end',
          fontSize: 15,
          fontWeight: 500,
          color: T.faint,
          letterSpacing: 0.18,
        },
        `${hr}:00`,
      ),
    ]),
    ...[1, 2, 3, 4].map((i) =>
      abs({ left: day(i), top: HEAD, bottom: 0, width: 1, backgroundColor: T.gridHour }),
    ),
    block(0, 10, 0, 11, 30, 'sky', '팀 회의'),
    block(0, 13, 0, 14, 0, 'green', '운동'),
    block(1, 9, 30, 11, 0, 'coral', '스터디'),
    block(1, 12, 0, 13, 0, 'amber', '점심 약속'),
    block(2, 10, 30, 12, 0, 'violet', '디자인 리뷰'),
    block(2, 13, 30, 15, 0, 'sky', '프로젝트'),
    block(3, 9, 0, 10, 0, 'green', '운동'),
    block(3, 11, 30, 13, 0, 'coral', '수업'),
    block(4, 10, 0, 11, 0, 'amber', '멘토링'),
    block(4, 12, 30, 14, 30, 'green', '작업 시간'),
    // now line (red, white halo) across today's column
    abs({
      left: day(2),
      width: COL,
      top: y(12, 50),
      height: 2.5,
      backgroundColor: T.now,
      boxShadow: '0 0 0 1.5px rgba(255,255,255,.85)',
    }),
    abs({
      left: day(2) - 5,
      top: y(12, 50) - 4.5,
      width: 11,
      height: 11,
      borderRadius: 99,
      backgroundColor: T.now,
      boxShadow: '0 0 0 2.5px rgba(255,255,255,.85)',
    }),
  );

const page = (title) =>
  h(
    'div',
    {
      display: 'flex',
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: T.bg,
      fontFamily: 'Pretendard',
      color: T.ink,
      overflow: 'hidden',
    },
    // login screen's brand tints (src/styles/auth.js), one layer per gradient
    abs({
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      backgroundImage:
        'radial-gradient(at 12% -10%, rgba(233,109,79,.14) 0%, rgba(233,109,79,0) 55%)',
    }),
    abs({
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      backgroundImage:
        'radial-gradient(at 100% 0%, rgba(78,158,219,.12) 0%, rgba(78,158,219,0) 45%)',
    }),
    // left column
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 84,
        width: 538,
        height: '100%',
      },
      h(
        'div',
        {
          display: 'flex',
          width: 92,
          height: 92,
          borderRadius: 26,
          backgroundColor: T.ink,
          padding: 20,
          marginBottom: 44,
          justifyContent: 'space-between',
          alignItems: 'stretch',
        },
        h('div', { display: 'flex', width: 22, height: 36, marginTop: 'auto', borderRadius: 8, backgroundColor: T.markA }),
        h('div', { display: 'flex', width: 22, height: 31, borderRadius: 8, backgroundColor: T.markB }),
      ),
      h(
        'div',
        {
          // step the scale down for long board names; keep-all wraps Korean
          // at word boundaries instead of mid-word
          fontSize: title.length <= 6 ? 76 : title.length <= 12 ? 56 : 44,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.12,
          wordBreak: 'keep-all',
        },
        title,
      ),
      h(
        'div',
        { marginTop: 22, fontSize: 30, fontWeight: 500, lineHeight: 1.45, color: T.muted, whiteSpace: 'pre-line' },
        '실시간으로 함께 쓰는\n주간 시간표',
      ),
      h('div', { marginTop: 30, fontSize: 22, fontWeight: 600, letterSpacing: 0.22, color: T.faint }, 'Weekly Planner'),
    ),
    card(),
  );

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.end();
  }
  if (req.method && req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.end('Method not allowed');
  }

  let title = '주간 계획표';
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    title = sanitizeOgImageTitle(url.searchParams.get('title'), '주간 계획표');
  } catch {
    /* keep default */
  }

  try {
    const image = new ImageResponse(page(title), {
      width: 1200,
      height: 630,
      fonts: await loadFonts(),
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
    res.statusCode = image.status;
    image.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    return res.end(Buffer.from(await image.arrayBuffer()));
  } catch (err) {
    console.error('og image failed', err);
    res.statusCode = 500;
    return res.end('OG image generation failed');
  }
}
