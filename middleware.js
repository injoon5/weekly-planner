/**
 * Bot-only rewrite for shared planner URLs.
 * Humans keep the SPA (/s/:token → index.html). Crawlers get /api/share-meta
 * so Open Graph / Twitter / Kakao unfurls see absolute meta + dynamic titles.
 */
import { rewrite } from '@vercel/functions';
import { isSocialCrawler } from './src/server/og-meta.js';

export const config = {
  matcher: '/s/:token*',
};

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!isSocialCrawler(ua)) return;

  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/s\/([^/]+)\/?$/);
  if (!match) return;

  const dest = new URL('/api/share-meta', request.url);
  dest.searchParams.set('token', match[1]);
  return rewrite(dest);
}
