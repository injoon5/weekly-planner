/**
 * Pure request-shape helpers for the REST API (`/api/v1/*`): route matching,
 * a token-bucket rate limiter (same semantics as Instant's rate limits —
 * https://www.instantdb.com/docs/rate-limits), and payload normalizers.
 * Kept free of I/O so the whole surface is unit-testable.
 */

/** `/api/v1/boards/abc/events` → ['boards', 'abc', 'events'] */
export function restSegments(url) {
  const path = String(url || '').split('?')[0];
  const m = /^\/api\/v1(?:\/(.*))?$/.exec(path);
  if (!m) return null;
  return (m[1] || '')
    .split('/')
    .map((s) => {
      // Malformed percent-encoding must 404, not throw before the handler's
      // try/catch — keep the raw segment so no route matches it.
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .filter(Boolean);
}

/**
 * Route table. Returns `{ name, params }` or null.
 * @param {string} method @param {string[] | null} segments
 */
export function matchRestRoute(method, segments) {
  if (!segments) return null;
  const M = String(method || 'GET').toUpperCase();
  const [a, b, c] = segments;
  const len = segments.length;

  if (len === 1 && a === 'me' && M === 'GET') return { name: 'me.get', params: {} };

  if (a === 'boards') {
    if (len === 1 && M === 'GET') return { name: 'boards.list', params: {} };
    if (len === 1 && M === 'POST') return { name: 'boards.create', params: {} };
    if (len === 2 && M === 'GET') return { name: 'boards.get', params: { boardId: b } };
    if (len === 2 && M === 'PATCH') return { name: 'boards.update', params: { boardId: b } };
    if (len === 2 && M === 'DELETE') return { name: 'boards.delete', params: { boardId: b } };
    if (len === 3 && c === 'events' && M === 'GET')
      return { name: 'events.list', params: { boardId: b } };
    if (len === 3 && c === 'events' && M === 'POST')
      return { name: 'events.create', params: { boardId: b } };
    return null;
  }

  if (a === 'events' && len === 2) {
    if (M === 'GET') return { name: 'events.get', params: { eventId: b } };
    if (M === 'PATCH') return { name: 'events.update', params: { eventId: b } };
    if (M === 'DELETE') return { name: 'events.delete', params: { eventId: b } };
    return null;
  }

  if (a === 'todos') {
    if (len === 1 && M === 'GET') return { name: 'todos.list', params: {} };
    if (len === 1 && M === 'POST') return { name: 'todos.create', params: {} };
    if (len === 2 && M === 'DELETE') return { name: 'todos.delete', params: { todoId: b } };
    return null;
  }

  if (a === 'token' && b === 'refresh' && len === 2 && M === 'POST')
    return { name: 'token.refresh', params: {} };

  return null;
}

/**
 * Greedy token bucket per key, mirroring Instant's rate-limit semantics.
 * @param {{ capacity: number, refillPeriodMs: number, refillAmount?: number, now?: () => number }} opts
 */
export function createRateLimiter({ capacity, refillPeriodMs, refillAmount = capacity, now = Date.now }) {
  /** @type {Map<string, { tokens: number, at: number }>} */
  const buckets = new Map();
  const perMs = refillAmount / refillPeriodMs;
  // A fully-refilled bucket is indistinguishable from no bucket, so idle keys
  // can be dropped. Sweep on a size threshold to keep long-lived instances
  // from accumulating one entry per token seen since boot.
  const SWEEP_THRESHOLD = 1024;

  const sweep = (t) => {
    for (const [key, bucket] of buckets) {
      if (bucket.tokens + (t - bucket.at) * perMs >= capacity) buckets.delete(key);
    }
  };

  return {
    /** @param {string} key @param {number} [cost] */
    take(key, cost = 1) {
      const t = now();
      if (buckets.size >= SWEEP_THRESHOLD) sweep(t);
      const bucket = buckets.get(key) || { tokens: capacity, at: t };
      bucket.tokens = Math.min(capacity, bucket.tokens + (t - bucket.at) * perMs);
      bucket.at = t;
      if (bucket.tokens >= cost) {
        bucket.tokens -= cost;
        buckets.set(key, bucket);
        return { ok: true };
      }
      buckets.set(key, bucket);
      const retryAfterSec = Math.ceil((cost - bucket.tokens) / perMs / 1000);
      return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
    },
  };
}

/** Fields a REST client may set on a board. */
export function restBoardFields(input = {}, { partial = false } = {}) {
  const out = {};
  if (!partial || input.name !== undefined) {
    if (typeof input.name === 'string' && input.name.trim()) {
      out.name = input.name.trim().slice(0, 40);
    } else if (!partial) {
      out.name = '시간표';
    }
  }
  for (const k of ['from', 'to']) {
    if (input[k] === undefined) continue;
    const v = String(input[k] || '');
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      throw new RestValidationError(`${k} must be YYYY-MM-DD`);
    }
    out[k] = v;
  }
  if (input.repeatEvery !== undefined) {
    const n = Math.round(Number(input.repeatEvery));
    if (!Number.isFinite(n) || n < 0 || n > 8) {
      throw new RestValidationError('repeatEvery must be an integer between 0 and 8');
    }
    out.repeatEvery = n;
  }
  return out;
}

/** `YYYY-MM-DD` planner date used by todos rows. */
export function isPlannerDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export class RestValidationError extends Error {}
