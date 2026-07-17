import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from '@vercel/og';
import {
  decodeOgEvents,
  ogImageSubtitle,
  sanitizeOgImageTitle,
  sanitizeOgOwner,
  OG_DAY_ORIGIN,
} from '../src/server/og-meta.js';

const fontDir = join(dirname(fileURLToPath(import.meta.url)), 'fonts');

/**
 * Open Graph share card (1200×630), rendered on demand with @vercel/og
 * (Satori). Mirrors the app's light theme: the login mark and brand tints,
 * Pretendard, and a cropped week-grid card built from the real design tokens
 * (src/tokens.stylex.js, src/styles/palette.css).
 *
 * GET /api/og                         → default demo card
 * GET /api/og?title=이름               → titled demo card
 * GET /api/og?title=…&owner=…&n=12&e=… → open-share card with real schedule snippet
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
  teal: ['#d3efea', '#136259', 'rgba(63,169,155,'],
  sky: ['#d8ebfa', '#175e92', 'rgba(78,158,219,'],
  violet: ['#e6e2fa', '#4a3ea8', 'rgba(133,120,222,'],
  pink: ['#fadfed', '#a02c6e', 'rgba(224,99,168,'],
  graphite: ['#eaeaee', '#41414b', 'rgba(143,143,156,'],
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

/** Demo blocks used when no real schedule is supplied (landing / password / disabled). */
const DEMO_BLOCKS = [
  [0, 10, 0, 11, 30, 'sky', '팀 회의'],
  [0, 13, 0, 14, 0, 'green', '운동'],
  [1, 9, 30, 11, 0, 'coral', '스터디'],
  [1, 12, 0, 13, 0, 'amber', '점심 약속'],
  [2, 10, 30, 12, 0, 'violet', '디자인 리뷰'],
  [2, 13, 30, 15, 0, 'sky', '프로젝트'],
  [3, 9, 0, 10, 0, 'green', '운동'],
  [3, 11, 30, 13, 0, 'coral', '수업'],
  [4, 10, 0, 11, 0, 'amber', '멘토링'],
  [4, 12, 30, 14, 30, 'green', '작업 시간'],
];

// Satori accepts plain React-shaped element objects; a tiny helper keeps this
// file dependency-free instead of pulling in a JSX transform.
const h = (type, style, ...children) => ({
  type,
  props: { style, children: children.length > 1 ? children : children[0] },
});
const abs = (style, ...children) =>
  h('div', { position: 'absolute', display: 'flex', ...style }, ...children);

const block = (d, h1, m1, h2, m2, color, title) => {
  const [bg, fg, accent] = EV[color] || EV.sky;
  const dur = h2 - h1 + (m2 - m1) / 60;
  if (dur <= 0) return null;
  return abs(
    {
      flexDirection: 'column',
      left: day(d) + 5,
      top: y(h1, m1) + 2,
      width: COL - 10,
      height: Math.max(dur * ROW - 4, 28),
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
    h(
      'div',
      {
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: -0.07,
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
      },
      title,
    ),
    h(
      'div',
      {
        marginTop: 2,
        fontSize: 14,
        fontWeight: 500,
        opacity: 0.72,
        letterSpacing: 0,
        whiteSpace: 'nowrap',
      },
      `${h1}:${String(m1).padStart(2, '0')}–${h2}:${String(m2).padStart(2, '0')}`,
    ),
  );
};

/** Convert planner start (minutes from 06:00) → clock h/m. */
function clockParts(startMin) {
  const mid = startMin + OG_DAY_ORIGIN;
  return { h: Math.floor(mid / 60), m: mid % 60 };
}

function blocksFromEvents(events) {
  const out = [];
  for (const e of events) {
    // day 1–5 → column 0–4
    const col = e.day - 1;
    if (col < 0 || col > 4) continue;
    const a = clockParts(e.start);
    const b = clockParts(e.start + e.dur);
    const node = block(col, a.h, a.m, b.h, b.m, e.color, e.title);
    if (node) out.push(node);
  }
  return out;
}

function blocksFromDemo() {
  return DEMO_BLOCKS.map(([d, h1, m1, h2, m2, color, title]) =>
    block(d, h1, m1, h2, m2, color, title),
  ).filter(Boolean);
}

const nowLine = () => [
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
];

/** Lucide `lock` as a data-URI — stroke SVGs via Satori nodes often collapse. */
const LOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 24 24" fill="none" stroke="#1B1B20" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const LOCK_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(LOCK_SVG).toString('base64')}`;

const lockIcon = (size = 108) => ({
  type: 'img',
  props: {
    src: LOCK_DATA_URL,
    width: size,
    height: size,
    style: { width: size, height: size },
  },
});

const dayHeaders = () =>
  ['월', '화', '수', '목', '금'].map((d, i) =>
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
  );

/** Time gutter labels — stay sharp even when the schedule body is locked. */
const timeGutter = () =>
  [9, 10, 11, 12, 13, 14, 15].map((hr) =>
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
  );

/** Inner schedule body (grid lines + events). Blurred for password shares. */
const scheduleBody = (eventBlocks, showNow) => [
  ...[9, 10, 11, 12, 13, 14, 15].map((hr) =>
    abs({ left: 0, right: 0, top: y(hr) - HEAD, height: 1, backgroundColor: T.gridHour }),
  ),
  ...[1, 2, 3, 4].map((i) =>
    abs({ left: day(i) - GUT, top: 0, bottom: 0, width: 1, backgroundColor: T.gridHour }),
  ),
  // Reposition event/now blocks from card coords → body-local (origin at GUT, HEAD).
  ...eventBlocks.map((node) => shiftAbs(node, -GUT, -HEAD)),
  ...(showNow ? nowLine().map((node) => shiftAbs(node, -GUT, -HEAD)) : []),
];

function shiftAbs(node, dx, dy) {
  if (!node?.props?.style) return node;
  const style = { ...node.props.style };
  if (typeof style.left === 'number') style.left += dx;
  if (typeof style.top === 'number') style.top += dy;
  return { ...node, props: { ...node.props, style } };
}

const lockedOverlay = () => [
  // Frosted wash over the schedule body only (headers/gutter stay clear).
  abs({
    left: GUT,
    top: HEAD,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(246,246,247,0.42)',
  }),
  abs(
    {
      left: GUT,
      top: HEAD,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    h(
      'div',
      {
        display: 'flex',
        width: 196,
        height: 196,
        borderRadius: 48,
        backgroundColor: 'rgba(255,255,255,0.88)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'rgba(24,24,28,0.08)',
        boxShadow: '0 18px 40px rgba(20,20,26,.16)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      lockIcon(120),
    ),
  ),
];

const card = ({ eventBlocks, showNow, locked }) =>
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
    // Frame chrome — always sharp.
    ...dayHeaders(),
    abs({ left: 0, right: 0, top: HEAD, height: 1, backgroundColor: T.line }),
    abs({ left: GUT, top: 0, bottom: 0, width: 1, backgroundColor: T.line }),
    ...timeGutter(),
    // Schedule body — blurred inside for password shares.
    locked
      ? abs(
          {
            left: GUT,
            top: HEAD,
            width: 5 * COL,
            height: 640 - HEAD,
            overflow: 'hidden',
            filter: 'blur(28px)',
          },
          ...scheduleBody(eventBlocks, showNow),
        )
      : abs(
          {
            left: GUT,
            top: HEAD,
            width: 5 * COL,
            height: 640 - HEAD,
            overflow: 'hidden',
          },
          ...scheduleBody(eventBlocks, showNow),
        ),
    ...(locked ? lockedOverlay() : []),
  );

const page = ({ title, subtitle, eventBlocks, showNow, locked }) =>
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
          // Long board names: single-line ellipsis inside the left column width.
          // Character cap still applies via sanitizeOgImageTitle.
          width: 420,
          fontSize: title.length <= 6 ? 76 : title.length <= 12 ? 56 : 44,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.12,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        title,
      ),
      h(
        'div',
        {
          marginTop: 22,
          width: 420,
          fontSize: 30,
          fontWeight: 500,
          lineHeight: 1.45,
          color: T.muted,
          whiteSpace: subtitle ? 'nowrap' : 'pre-line',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        subtitle ||
          (locked ? '비밀번호가 필요한\n공유 시간표' : '실시간으로 함께 쓰는\n주간 시간표'),
      ),
      h('div', { marginTop: 30, fontSize: 22, fontWeight: 600, letterSpacing: 0.22, color: T.faint }, 'Weekly Planner'),
    ),
    card({ eventBlocks, showNow, locked }),
  );

function parseOgRequest(req) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const title = sanitizeOgImageTitle(url.searchParams.get('title'), '주간 계획표');
  const owner = sanitizeOgOwner(url.searchParams.get('owner') || '');
  const eventCount = Math.min(999, Math.max(0, Math.round(Number(url.searchParams.get('n')) || 0)));
  const locked =
    url.searchParams.get('locked') === '1' || url.searchParams.get('locked') === 'true';
  const hasReal = url.searchParams.has('e');
  const events = hasReal ? decodeOgEvents(url.searchParams.get('e')) : null;
  const subtitle = ogImageSubtitle({ owner, eventCount }) || '';
  // Locked cards always use the demo table (blurred) — never real events.
  const eventBlocks = locked || !hasReal ? blocksFromDemo() : blocksFromEvents(events);
  const showNow = locked || !hasReal;
  return { title, subtitle, eventBlocks, showNow, locked };
}

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

  let props = {
    title: '주간 계획표',
    subtitle: '',
    eventBlocks: blocksFromDemo(),
    showNow: true,
    locked: false,
  };
  try {
    props = parseOgRequest(req);
  } catch {
    /* keep default */
  }

  try {
    const image = new ImageResponse(page(props), {
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
