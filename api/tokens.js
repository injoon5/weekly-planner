import { init, id } from '@instantdb/admin';
import {
  apiTokenName,
  apiTokenPrefixOf,
  generateApiToken,
  hashApiToken,
} from '../src/server/api-tokens.js';
import { linkedId } from '../src/lib/links.js';
import schema from '../src/db/schema.js';

const APP_ID = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;
const API_TOKEN_PEPPER = process.env.API_TOKEN_PEPPER || '';

/** Personal-access-token cap per account. */
const MAX_TOKENS = 10;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function tokenRowJson(row) {
  return {
    id: row.id,
    name: row.name || '',
    prefix: row.prefix,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt ?? null,
  };
}

/**
 * REST API token management, authenticated with the signed-in session
 * (header `token` = Instant refresh token, same convention as /api/invite).
 *
 *   GET    → list the caller's tokens (never the secret)
 *   POST   → { name? } create · { rotate: id } re-generate the secret
 *   DELETE → { id } revoke
 *
 * The plaintext `wp_…` token appears once in the create/rotate response;
 * only its SHA-256 hash is stored.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!APP_ID || !ADMIN_TOKEN) {
    return json(res, 500, { error: '서버 설정이 없어요' });
  }

  let body = {};
  if (req.method !== 'GET') {
    try {
      body = await readBody(req);
    } catch {
      return json(res, 400, { error: '잘못된 요청이에요' });
    }
  }

  const refreshToken = req.headers.token || body.refreshToken;
  if (!refreshToken) {
    return json(res, 401, { error: '로그인이 필요해요' });
  }

  const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

  try {
    const caller = await db.auth.verifyToken(refreshToken);
    if (!caller?.id) {
      return json(res, 401, { error: '로그인이 필요해요' });
    }
    if (!caller.email) {
      return json(res, 403, { error: '게스트는 API 토큰을 만들 수 없어요' });
    }

    const { apiTokens } = await db.query({
      apiTokens: { $: { where: { 'owner.id': caller.id } }, owner: {} },
    });
    const mine = apiTokens || [];

    if (req.method === 'GET') {
      return json(res, 200, {
        tokens: mine
          .slice()
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
          .map(tokenRowJson),
      });
    }

    if (req.method === 'DELETE') {
      const row = mine.find((t) => t.id === body.id);
      if (!row) return json(res, 404, { error: '토큰을 찾을 수 없어요' });
      await db.transact(db.tx.apiTokens[row.id].delete());
      return json(res, 200, { ok: true });
    }

    // POST { rotate: id } — keep the row, swap the secret.
    if (body.rotate) {
      const row = mine.find((t) => t.id === body.rotate);
      if (!row || linkedId(row.owner) !== caller.id) {
        return json(res, 404, { error: '토큰을 찾을 수 없어요' });
      }
      const token = generateApiToken();
      const hash = await hashApiToken(token, API_TOKEN_PEPPER);
      await db.transact(
        db.tx.apiTokens[row.id].update({ hash, prefix: apiTokenPrefixOf(token) }),
      );
      return json(res, 200, { ...tokenRowJson({ ...row, prefix: apiTokenPrefixOf(token) }), token });
    }

    // POST { name? } — create.
    if (mine.length >= MAX_TOKENS) {
      return json(res, 400, { error: `토큰은 최대 ${MAX_TOKENS}개까지 만들 수 있어요` });
    }
    const token = generateApiToken();
    const hash = await hashApiToken(token, API_TOKEN_PEPPER);
    const tid = id();
    const row = {
      name: apiTokenName(body.name),
      hash,
      prefix: apiTokenPrefixOf(token),
      createdAt: Date.now(),
    };
    await db.transact(db.tx.apiTokens[tid].update(row).link({ owner: caller.id }));
    return json(res, 200, { ...tokenRowJson({ id: tid, ...row }), token });
  } catch (err) {
    console.error('tokens endpoint failed', err);
    return json(res, 500, { error: '요청을 처리하지 못했어요' });
  }
}
