/**
 * Renders public/og.png (1200×630) — the Open Graph / social share card.
 *
 * The card is plain HTML styled with the app's design tokens (tokens.stylex.js,
 * palette.css) and screenshotted with headless Chromium, so the share image
 * stays in the product's own visual language.
 *
 * Usage: npm run generate:og
 *
 * Env:
 *   OG_CHROMIUM  path to a Chromium binary   (default: /opt/pw-browsers/chromium)
 *   OG_FONT_DIR  dir with Pretendard-{Medium,SemiBold,Bold}.woff2
 *                (downloaded from jsdelivr when absent)
 */
import { mkdtempSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og.png');
const CHROMIUM = process.env.OG_CHROMIUM || '/opt/pw-browsers/chromium';
const FONT_CDN = 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/woff2';
const WEIGHTS = [
  ['Medium', 500],
  ['SemiBold', 600],
  ['Bold', 700],
];

async function ensureFonts(dir) {
  for (const [name] of WEIGHTS) {
    const file = join(dir, `Pretendard-${name}.woff2`);
    if (existsSync(file)) continue;
    const src = process.env.OG_FONT_DIR && join(process.env.OG_FONT_DIR, `Pretendard-${name}.woff2`);
    if (src && existsSync(src)) {
      copyFileSync(src, file);
      continue;
    }
    const res = await fetch(`${FONT_CDN}/Pretendard-${name}.woff2`);
    if (!res.ok) throw new Error(`font download failed: ${name} ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
}

// Light-theme tokens (src/tokens.stylex.js) + event palette (src/styles/palette.css).
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
  coral: ['#ffe3dd', '#a13a28', '#e96d4f'],
  amber: ['#ffebc6', '#8a5a06', '#e6a23c'],
  green: ['#d9f0db', '#22683a', '#53ae6e'],
  sky: ['#d8ebfa', '#175e92', '#4e9edb'],
  violet: ['#e6e2fa', '#4a3ea8', '#8578de'],
};

// Mini week grid: 5 day columns, hour rows 9:00–14:00, ~1.6× app metrics.
const GUT = 78; // time gutter width
const COL = 118; // day column width
const ROW = 86; // hour row height
const HEAD = 64; // day header height
const day = (d) => GUT + d * COL;
const y = (h, m = 0) => HEAD + (h - 9 + m / 60) * ROW;

const block = (d, h1, m1, h2, m2, color, title) => {
  const [bg, fg, accent] = EV[color];
  return `<div class="blk" style="left:${day(d) + 5}px;top:${y(h1, m1) + 2}px;width:${COL - 10}px;height:${(h2 - h1 + (m2 - m1) / 60) * ROW - 4}px;background:${bg};color:${fg};box-shadow:inset 0 0 0 1.5px color-mix(in srgb, ${accent} 22%, transparent)">
    <i style="background:${accent}"></i>
    <b>${title}</b>
    <span>${h1}:${String(m1).padStart(2, '0')} – ${h2}:${String(m2).padStart(2, '0')}</span>
  </div>`;
};

const html = (fontDir) => `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: P; font-weight: 500; src: url('${pathToFileURL(join(fontDir, 'Pretendard-Medium.woff2'))}') format('woff2'); }
  @font-face { font-family: P; font-weight: 600; src: url('${pathToFileURL(join(fontDir, 'Pretendard-SemiBold.woff2'))}') format('woff2'); }
  @font-face { font-family: P; font-weight: 700; src: url('${pathToFileURL(join(fontDir, 'Pretendard-Bold.woff2'))}') format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    position: relative;
    display: flex;
    align-items: center;
    gap: 64px;
    padding: 72px 0 72px 84px;
    font-family: P, sans-serif;
    color: ${T.ink};
    background-color: ${T.bg};
    /* login screen's brand tints (src/styles/auth.js) */
    background-image:
      radial-gradient(1200px 600px at 12% -10%, color-mix(in srgb, ${T.markA} 14%, transparent), transparent 60%),
      radial-gradient(900px 500px at 100% 0%, color-mix(in srgb, ${T.markB} 12%, transparent), transparent 55%);
    -webkit-font-smoothing: antialiased;
    font-synthesis: none;
  }

  .left { flex: 1 1 auto; min-width: 0; }
  .mark {
    width: 92px; height: 92px; border-radius: 26px;
    background: ${T.ink};
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 20px;
    margin-bottom: 44px;
  }
  .mark i { border-radius: 8px; }
  .mark i:first-child { background: ${T.markA}; align-self: end; height: 36px; }
  .mark i:last-child { background: ${T.markB}; align-self: start; height: 31px; }
  h1 {
    font-size: 76px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1;
    text-wrap: balance;
  }
  .sub {
    margin-top: 22px;
    font-size: 30px; font-weight: 500; line-height: 1.45; color: ${T.muted};
    text-wrap: pretty;
  }
  .en {
    margin-top: 30px;
    font-size: 22px; font-weight: 600; letter-spacing: 0.01em; color: ${T.faint};
  }

  /* week-grid card, cropped by the canvas edge */
  .card {
    position: relative; flex: none;
    width: ${GUT + 5 * COL}px; height: 640px;
    margin-bottom: -160px; margin-right: -56px;
    background: ${T.paper};
    border-radius: 20px;
    box-shadow: 0 0 0 1px ${T.line}, 0 4px 12px rgba(20,20,26,.06), 0 24px 48px -20px rgba(20,20,26,.28);
    overflow: hidden;
  }
  .dhead {
    position: absolute; top: 0; height: ${HEAD}px;
    display: flex; align-items: center; justify-content: center;
    font-size: 21px; font-weight: 600;
  }
  .dline { position: absolute; top: ${HEAD}px; left: 0; right: 0; height: 1px; background: ${T.line}; }
  .gline { position: absolute; top: 0; bottom: 0; left: ${GUT}px; width: 1px; background: ${T.line}; }
  .dhead.today b {
    width: 38px; height: 38px; border-radius: 99px; background: ${T.ink}; color: #fff;
    display: flex; align-items: center; justify-content: center; font-weight: 600;
  }
  .hline { position: absolute; left: 0; right: 0; height: 1px; background: ${T.gridHour}; }
  .gtime {
    position: absolute; right: ${5 * COL + 12}px; transform: translateY(-50%);
    font-size: 15px; font-weight: 500; color: ${T.faint};
    font-variant-numeric: tabular-nums; letter-spacing: 0.012em;
  }
  .vline { position: absolute; top: ${HEAD}px; bottom: 0; width: 1px; background: ${T.gridHour}; }

  .blk {
    position: absolute; border-radius: 10px; padding: 8px 12px 8px 20px;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .blk i { position: absolute; left: 5px; top: 5px; bottom: 5px; width: 5px; border-radius: 99px; }
  .blk b { font-size: 19px; font-weight: 600; letter-spacing: -0.004em; line-height: 1.25; white-space: nowrap; }
  .blk span { margin-top: 2px; font-size: 15px; font-weight: 500; opacity: .72; font-variant-numeric: tabular-nums; letter-spacing: 0.012em; }

  .now { position: absolute; height: 2.5px; background: ${T.now}; box-shadow: 0 0 0 1.5px rgba(255,255,255,.85); }
  .now::before {
    content: ""; position: absolute; left: -5px; top: 50%; transform: translateY(-50%);
    width: 11px; height: 11px; border-radius: 99px; background: ${T.now};
    box-shadow: 0 0 0 2.5px rgba(255,255,255,.85);
  }
</style>
<body>
  <div class="left">
    <div class="mark"><i></i><i></i></div>
    <h1>주간 계획표</h1>
    <p class="sub">실시간으로 함께 쓰는<br>주간 시간표</p>
    <p class="en">Weekly Planner</p>
  </div>

  <div class="card">
    ${['월', '화', '수', '목', '금']
      .map(
        (d, i) =>
          `<div class="dhead${i === 2 ? ' today' : ''}" style="left:${day(i)}px;width:${COL}px">${i === 2 ? `<b>${d}</b>` : d}</div>`,
      )
      .join('\n    ')}
    ${[9, 10, 11, 12, 13, 14, 15]
      .map((h) => `<div class="hline" style="top:${y(h)}px"></div><div class="gtime" style="top:${y(h)}px">${h}:00</div>`)
      .join('\n    ')}
    ${[1, 2, 3, 4].map((i) => `<div class="vline" style="left:${day(i)}px"></div>`).join('\n    ')}
    <div class="dline"></div>
    <div class="gline"></div>

    ${block(0, 10, 0, 11, 30, 'sky', '팀 회의')}
    ${block(0, 13, 0, 14, 0, 'green', '운동')}
    ${block(1, 9, 30, 11, 0, 'coral', '스터디')}
    ${block(1, 12, 0, 13, 0, 'amber', '점심 약속')}
    ${block(2, 10, 30, 12, 0, 'violet', '디자인 리뷰')}
    ${block(2, 13, 30, 15, 0, 'sky', '프로젝트')}
    ${block(3, 9, 0, 10, 0, 'green', '운동')}
    ${block(3, 11, 30, 13, 0, 'coral', '수업')}
    ${block(4, 10, 0, 11, 0, 'amber', '멘토링')}
    ${block(4, 12, 30, 14, 30, 'green', '작업 시간')}

    <div class="now" style="left:${day(2)}px;width:${COL}px;top:${y(12, 50)}px"></div>
  </div>
</body>`;

const work = mkdtempSync(join(tmpdir(), 'og-'));
await ensureFonts(work);
const page_path = join(work, 'og.html');
writeFileSync(page_path, html(work));

const browser = await chromium.launch({ executablePath: CHROMIUM });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(page_path).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT });
  console.log('wrote', OUT);
} finally {
  await browser.close();
}
