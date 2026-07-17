import { init } from '@instantdb/admin';
import schema from '../src/db/schema.js';
import {
  DEFAULT_OG_DESCRIPTION,
  DEFAULT_OG_TITLE,
  DEFAULT_OG_IMAGE_TITLE,
  buildOgImageUrl,
  ownerLabelFrom,
  renderShareOgHtml,
  resolveShareOgCard,
} from '../src/server/og-meta.js';

const APP_ID = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

function originFromReq(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${String(host).split(',')[0].trim()}`;
}

function html(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.end(body);
}

async function lookupShareCard(token) {
  const fallback = resolveShareOgCard(null, null);
  if (!token || !APP_ID || !ADMIN_TOKEN) return fallback;

  try {
    const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });
    const { shares } = await db.query({
      shares: {
        $: { where: { token } },
        board: {
          owner: { settings: {} },
          events: {},
        },
      },
    });
    const share = shares?.[0] || null;
    const board = share?.board || null;
    const owner = ownerLabelFrom(board?.owner);
    const events = Array.isArray(board?.events) ? board.events : [];
    return resolveShareOgCard(share, board, { owner, events });
  } catch (err) {
    console.error('share-meta lookup failed', err);
    return fallback;
  }
}

/**
 * Crawler-only HTML for /s/:token (rewritten from middleware).
 * GET /api/share-meta?token=…
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.end();
  }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.end('Method not allowed');
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const token = (url.searchParams.get('token') || '').trim();
  const origin = originFromReq(req);
  const card = token
    ? await lookupShareCard(token)
    : {
        title: DEFAULT_OG_TITLE,
        description: DEFAULT_OG_DESCRIPTION,
        imageTitle: DEFAULT_OG_IMAGE_TITLE,
        owner: '',
        eventCount: 0,
        events: [],
        useRealSchedule: false,
        locked: false,
      };

  const pageUrl = token ? `${origin}/s/${encodeURIComponent(token)}` : `${origin}/`;
  const imageUrl = buildOgImageUrl(origin, card);
  const imageAlt = card.owner
    ? `${card.imageTitle} · ${card.owner}의 주간 시간표 미리보기`
    : '주간 계획표 주간 시간표 미리보기';

  return html(
    res,
    200,
    renderShareOgHtml({
      title: card.title,
      description: card.description,
      url: pageUrl,
      imageUrl,
      imageAlt,
    }),
  );
}
