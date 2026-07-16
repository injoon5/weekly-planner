import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OG_TITLE,
  escapeHtml,
  isSocialCrawler,
  renderShareOgHtml,
  resolveShareOgCard,
  sanitizeOgImageTitle,
} from '../src/og-meta.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

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
    expect(sanitizeOgImageTitle('a'.repeat(40)).length).toBe(24);
    expect(sanitizeOgImageTitle('')).toBe('주간 계획표');
  });

  it('escapes HTML entities for meta content', () => {
    expect(escapeHtml(`A & B <C> "D" 'E'`)).toBe('A &amp; B &lt;C&gt; &quot;D&quot; &#39;E&#39;');
  });

  it('uses the board name for open enabled shares', () => {
    const card = resolveShareOgCard(
      { enabled: true, mode: 'open' },
      { name: '팀 위클리' },
    );
    expect(card.title).toBe('팀 위클리 · 주간 계획표');
    expect(card.imageTitle).toBe('팀 위클리');
  });

  it('hides board names for password shares', () => {
    const card = resolveShareOgCard(
      { enabled: true, mode: 'password' },
      { name: '비밀 보드' },
    );
    expect(card.title).toBe('공유된 주간 계획표');
    expect(card.imageTitle).toBe('주간 계획표');
    expect(card.title).not.toContain('비밀');
  });

  it('falls back when share is missing or disabled', () => {
    expect(resolveShareOgCard(null, null).title).toBe(DEFAULT_OG_TITLE);
    expect(resolveShareOgCard({ enabled: false, mode: 'open' }, { name: 'X' }).title).toBe(
      DEFAULT_OG_TITLE,
    );
  });

  it('renders absolute OG + Twitter tags for crawlers', () => {
    const html = renderShareOgHtml({
      title: '팀 위클리 · 주간 계획표',
      description: '실시간으로 함께 쓰는 주간 시간표',
      url: 'https://example.com/s/AbCdEf12',
      imageUrl: 'https://example.com/api/og?title=%ED%8C%80%20%EC%9C%84%ED%81%B4%EB%A6%AC',
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
