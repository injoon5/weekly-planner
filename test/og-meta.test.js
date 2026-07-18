import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OG_TITLE,
  buildOgImageSearchParams,
  buildOgImageUrl,
  decodeOgEvents,
  encodeOgEvents,
  escapeHtml,
  isSocialCrawler,
  ogImageSubtitle,
  ownerLabelFrom,
  pickOgEvents,
  renderShareOgHtml,
  resolveShareOgCard,
  sanitizeOgImageTitle,
  sanitizeOgOwner,
} from '../src/server/og-meta.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const sampleEvents = [
  { day: 1, start: 240, dur: 90, color: 'sky', title: '팀 회의' }, // Mon 10:00
  { day: 2, start: 180, dur: 90, color: 'coral', title: '스터디' }, // Tue 09:00
  { day: 3, start: 270, dur: 90, color: 'violet', title: '디자인 리뷰' }, // Wed 10:30
  { day: 0, start: 240, dur: 60, color: 'green', title: '주말' }, // Sun — skipped
  { day: 1, start: 0, dur: 60, color: 'amber', title: '새벽' }, // Mon 06:00 — outside window
  { day: 5, start: 600, dur: 60, color: 'pink', title: '저녁' }, // Fri 16:00 — outside
];

describe('og-meta helpers', () => {
  it('detects common social crawlers including Kakao', () => {
    expect(isSocialCrawler('facebookexternalhit/1.1')).toBe(true);
    expect(isSocialCrawler('Twitterbot/1.0')).toBe(true);
    expect(isSocialCrawler('Slackbot-LinkExpanding 1.0')).toBe(true);
    expect(isSocialCrawler('Discordbot/2.0')).toBe(true);
    expect(isSocialCrawler('kakaotalk-scrap/1.0')).toBe(true);
    expect(isSocialCrawler('Mozilla/5.0 (Macintosh) Chrome/120.0')).toBe(false);
  });

  it('sanitizes and caps image titles', () => {
    expect(sanitizeOgImageTitle('  스터디 시간표  ')).toBe('스터디 시간표');
    const long = sanitizeOgImageTitle('a'.repeat(40));
    expect(long.endsWith('.\u200B.\u200B.')).toBe(true);
    expect(long.length).toBe(24);
    expect(sanitizeOgImageTitle('')).toBe('주간 계획표');
  });

  it('sanitizes owners without leaking emails', () => {
    expect(sanitizeOgOwner('injoon@example.com')).toBe('injoon');
    expect(sanitizeOgOwner('  인준  ')).toBe('인준');
    const long = sanitizeOgOwner('x'.repeat(40));
    expect(long.endsWith('.\u200B.\u200B.')).toBe(true);
    expect(long.length).toBe(20);
    expect(sanitizeOgOwner('')).toBe('');
  });

  it('resolves owner labels from Instant-shaped records', () => {
    expect(ownerLabelFrom({ email: 'a@b.com', settings: { displayName: '인준' } })).toBe('인준');
    expect(ownerLabelFrom({ email: 'a@b.com', settings: [{ displayName: '인준' }] })).toBe('인준');
    expect(ownerLabelFrom({ email: 'injoon@x.com' })).toBe('injoon');
    expect(ownerLabelFrom(null)).toBe('');
  });

  it('escapes HTML entities for meta content', () => {
    expect(escapeHtml(`A & B <C> "D" 'E'`)).toBe('A &amp; B &lt;C&gt; &quot;D&quot; &#39;E&#39;');
  });

  it('picks weekday events inside the OG window and clips edges', () => {
    const picked = pickOgEvents([
      ...sampleEvents,
      { day: 4, start: 150, dur: 60, color: 'teal', title: '걸침' }, // 08:30–09:30 → clip to 09:00
    ]);
    expect(picked.every((e) => e.day >= 1 && e.day <= 5)).toBe(true);
    expect(picked.find((e) => e.title === '주말')).toBeUndefined();
    expect(picked.find((e) => e.title === '새벽')).toBeUndefined();
    expect(picked.find((e) => e.title === '저녁')).toBeUndefined();
    const clipped = picked.find((e) => e.title === '걸침');
    expect(clipped.start).toBe(180);
    expect(clipped.dur).toBe(30);
  });

  it('round-trips event encoding', () => {
    const encoded = encodeOgEvents(sampleEvents);
    const decoded = decodeOgEvents(encoded);
    expect(decoded.length).toBeGreaterThan(0);
    expect(decoded.every((e) => typeof e.title === 'string')).toBe(true);
    expect(decodeOgEvents('!!!not-base64!!!')).toEqual([]);
    expect(decodeOgEvents('')).toEqual([]);
  });

  it('builds owner/event subtitle for the image', () => {
    expect(ogImageSubtitle({ owner: '인준', eventCount: 12 })).toBe('인준 · 12개 일정');
    expect(ogImageSubtitle({ owner: '인준', eventCount: 0 })).toBe('인준의 시간표');
    expect(ogImageSubtitle({ owner: '', eventCount: 3 })).toBe('3개 일정');
    expect(ogImageSubtitle({})).toBe('');
  });

  it('uses the board name, owner, and schedule for open enabled shares', () => {
    const card = resolveShareOgCard(
      { enabled: true, mode: 'open' },
      {
        name: '팀 위클리',
        owner: { email: 'injoon@example.com', settings: { displayName: '인준' } },
        events: sampleEvents,
      },
    );
    expect(card.title).toBe('팀 위클리 · 주간 계획표');
    expect(card.imageTitle).toBe('팀 위클리');
    expect(card.owner).toBe('인준');
    expect(card.useRealSchedule).toBe(true);
    expect(card.events.length).toBeGreaterThan(0);
    expect(card.description).toContain('인준');
    expect(card.description).toContain('개 일정');

    const url = buildOgImageUrl('https://example.com', card);
    expect(url).toContain('/api/og?');
    expect(url).toContain('owner=');
    expect(url).toContain('e=');
    expect(url).toContain('n=');
  });

  it('hides board names, owner, and schedule for password shares', () => {
    const card = resolveShareOgCard(
      { enabled: true, mode: 'password' },
      {
        name: '비밀 보드',
        owner: { email: 'x@y.com', settings: { displayName: '비밀인' } },
        events: sampleEvents,
      },
    );
    expect(card.title).toBe('공유된 주간 계획표');
    expect(card.imageTitle).toBe('주간 계획표');
    expect(card.owner).toBe('');
    expect(card.useRealSchedule).toBe(false);
    expect(card.locked).toBe(true);
    expect(card.events).toEqual([]);
    expect(card.title).not.toContain('비밀');
    expect(card.description).not.toContain('비밀인');

    const params = buildOgImageSearchParams(card);
    expect(params.get('e')).toBeNull();
    expect(params.get('owner')).toBeNull();
    expect(params.get('locked')).toBe('1');
  });

  it('falls back when share is missing or disabled', () => {
    expect(resolveShareOgCard(null, null).title).toBe(DEFAULT_OG_TITLE);
    expect(resolveShareOgCard({ enabled: false, mode: 'open' }, { name: 'X' }).title).toBe(
      DEFAULT_OG_TITLE,
    );
  });

  it('still resolves open shares with empty schedules', () => {
    const card = resolveShareOgCard(
      { enabled: true, mode: 'open' },
      { name: '빈 보드', events: [] },
      { owner: '인준', events: [] },
    );
    expect(card.useRealSchedule).toBe(true);
    expect(card.events).toEqual([]);
    expect(buildOgImageSearchParams(card).get('e')).toBeTruthy();
  });

  it('rejects garbage event rows without throwing', () => {
    expect(
      pickOgEvents([
        null,
        { day: 'x', start: 1, dur: 1 },
        { day: 2, start: 200, dur: 60, color: 'nope', title: 'ok' },
      ]),
    ).toEqual([
      expect.objectContaining({ day: 2, color: 'sky', title: 'ok' }),
    ]);
  });

  it('renders absolute OG + Twitter tags for crawlers', () => {
    const html = renderShareOgHtml({
      title: '팀 위클리 · 주간 계획표',
      description: '인준님의 주간 시간표 · 3개 일정',
      url: 'https://example.com/s/AbCdEf12',
      imageUrl: 'https://example.com/api/og?title=%ED%8C%80%20%EC%9C%84%ED%81%B4%EB%A6%AC&owner=%EC%9D%B8%EC%A4%80',
    });
    expect(html).toContain('property="og:title" content="팀 위클리 · 주간 계획표"');
    expect(html).toContain('property="og:url" content="https://example.com/s/AbCdEf12"');
    expect(html).toContain('property="og:image" content="https://example.com/api/og?title=');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:image"');
  });
});

describe('share OG hosting wiring', () => {
  it('keeps a root middleware that only matches /s/:token', () => {
    const mw = readFileSync(join(root, 'middleware.js'), 'utf8');
    expect(mw).toContain("matcher: '/s/:token*'");
    expect(mw).toContain('isSocialCrawler');
    expect(mw).toContain('/api/share-meta');
  });

  it('exposes /api/share-meta and allows it in robots.txt', () => {
    expect(readFileSync(join(root, 'api/share-meta.js'), 'utf8')).toContain('lookupShareCard');
    expect(readFileSync(join(root, 'api/share-meta.js'), 'utf8')).toContain('owner: { settings');
    expect(readFileSync(join(root, 'api/share-meta.js'), 'utf8')).toContain('buildOgImageUrl');
    const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
    expect(robots).toContain('Allow: /api/og');
    expect(robots).toContain('Allow: /api/share-meta');
  });

  it('keeps /api routes out of the PWA navigate fallback', () => {
    const vite = readFileSync(join(root, 'vite.config.js'), 'utf8');
    expect(vite).toContain('navigateFallbackDenylist');
    expect(vite).toMatch(/\/\^\\\/api/);
  });
});
