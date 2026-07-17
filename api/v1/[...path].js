import { init, id } from '@instantdb/admin';
import {
  apiTokenPrefixOf,
  generateApiToken,
  hashApiToken,
  parseBearer,
} from '../../src/server/api-tokens.js';
import { linkedId, linkedIds } from '../../src/lib/links.js';
import { eventFields, nextBoardSortOrder } from '../../src/board/models.js';
import {
  RestValidationError,
  createRateLimiter,
  isPlannerDay,
  matchRestRoute,
  restBoardFields,
  restSegments,
} from '../../src/server/rest.js';
import schema from '../../src/db/schema.js';

const APP_ID = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

// Per-token bucket, same token-bucket semantics as Instant's own rate limits
// (https://www.instantdb.com/docs/rate-limits). Per-instance memory is fine
// here: it is a first line of defense in front of the $rateLimits buckets
// enforced by Instant's permission rules.
const limiter = createRateLimiter({ capacity: 120, refillPeriodMs: 60_000 });

/** Refresh `lastUsedAt` at most once a minute to avoid write amplification. */
const LAST_USED_STALE_MS = 60_000;

function json(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
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

function boardJson(board, userId) {
  const ownerId = linkedId(board.owner);
  return {
    id: board.id,
    name: board.name,
    from: board.from || '',
    to: board.to || '',
    repeatEvery: board.repeatEvery || 0,
    colorLabels: board.colorLabels || '',
    createdAt: board.createdAt,
    role:
      ownerId === userId
        ? 'owner'
        : linkedIds(board.editors).includes(userId)
          ? 'editor'
          : 'viewer',
  };
}

function eventJson(event) {
  return {
    id: event.id,
    boardId: linkedId(event.board) || undefined,
    ...eventFields(event),
    createdAt: event.createdAt,
  };
}

function todoJson(todo) {
  return { id: todo.id, day: todo.day, eventId: todo.eventId, createdAt: todo.createdAt };
}

/** Instant errors → REST statuses (permission denied, missing rows, 429s). */
function instantErrorStatus(err) {
  const type = err?.body?.type || err?.type;
  const message = String(err?.body?.message || err?.message || '');
  if (type === 'rate-limited') return 429;
  if (type === 'permission-denied' || /perm/i.test(message)) return 403;
  if (type === 'record-not-found' || /not.?found/i.test(message)) return 404;
  if (type === 'param-malformed' || type === 'validation-failed') return 400;
  return 500;
}

/**
 * Token-authenticated REST API over the planner's Instant data.
 *
 * Auth: `Authorization: Bearer wp_…` (create tokens on the account page or
 * via /api/tokens). All reads and writes are executed *as the token's owner*
 * (`db.asUser`), so Instant permission rules — ownership, membership, and
 * rate limits — apply exactly as they do in the app.
 *
 *   GET    /api/v1/me
 *   GET    /api/v1/boards
 *   POST   /api/v1/boards                 { name?, from?, to?, repeatEvery? }
 *   GET    /api/v1/boards/:id             (includes events)
 *   PATCH  /api/v1/boards/:id
 *   DELETE /api/v1/boards/:id
 *   GET    /api/v1/boards/:id/events
 *   POST   /api/v1/boards/:id/events      { day, title, start, dur, color?, memo? }
 *   GET    /api/v1/events/:id
 *   PATCH  /api/v1/events/:id
 *   DELETE /api/v1/events/:id
 *   GET    /api/v1/todos?day=YYYY-MM-DD   (checked-off marks)
 *   POST   /api/v1/todos                  { day, eventId }
 *   DELETE /api/v1/todos/:id
 *   POST   /api/v1/token/refresh          (rotate the calling token)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }
  if (!APP_ID || !ADMIN_TOKEN) {
    return json(res, 500, { error: 'Server is not configured' });
  }

  const route = matchRestRoute(req.method, restSegments(req.url));
  if (!route) {
    return json(res, 404, { error: 'No such endpoint' });
  }

  const bearer = parseBearer(req.headers.authorization);
  if (!bearer) {
    return json(res, 401, { error: 'Missing or malformed bearer token' }, {
      'WWW-Authenticate': 'Bearer realm="weekly-planner-api"',
    });
  }

  const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

  try {
    const hash = await hashApiToken(bearer);

    const gate = limiter.take(hash);
    if (!gate.ok) {
      return json(res, 429, { error: 'Rate limit exceeded' }, {
        'Retry-After': String(gate.retryAfterSec),
      });
    }

    const { apiTokens } = await db.query({
      apiTokens: { $: { where: { hash } }, owner: {} },
    });
    const tokenRow = apiTokens?.[0];
    const owner = tokenRow?.owner;
    if (!tokenRow || !owner?.id || !owner.email) {
      return json(res, 401, { error: 'Invalid token' });
    }

    // Impersonate the owner so Instant permissions do the authorization.
    const scoped = db.asUser({ email: owner.email });

    if (!tokenRow.lastUsedAt || Date.now() - tokenRow.lastUsedAt > LAST_USED_STALE_MS) {
      db.transact(db.tx.apiTokens[tokenRow.id].update({ lastUsedAt: Date.now() })).catch(
        () => {},
      );
    }

    let body = {};
    if (req.method === 'POST' || req.method === 'PATCH') {
      try {
        body = await readBody(req);
      } catch {
        return json(res, 400, { error: 'Request body must be JSON' });
      }
    }
    const query = new URL(req.url, 'http://localhost').searchParams;
    const { params } = route;

    switch (route.name) {
      case 'me.get': {
        return json(res, 200, { id: owner.id, email: owner.email });
      }

      case 'boards.list': {
        const { boards } = await scoped.query({ boards: { owner: {}, editors: {} } });
        return json(res, 200, {
          boards: (boards || [])
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((b) => boardJson(b, owner.id)),
        });
      }

      case 'boards.create': {
        const fields = restBoardFields(body);
        const { boards } = await scoped.query({ boards: {} });
        const bid = id();
        await scoped.transact(
          db.tx.boards[bid]
            .update({
              colorLabels: '',
              ...fields,
              createdAt: Date.now(),
              sortOrder: nextBoardSortOrder(boards || []),
            })
            .link({ owner: owner.id }),
        );
        const created = await scoped.query({
          boards: { $: { where: { id: bid } }, owner: {}, editors: {} },
        });
        return json(res, 201, { board: boardJson(created.boards[0], owner.id) });
      }

      case 'boards.get': {
        const { boards } = await scoped.query({
          boards: { $: { where: { id: params.boardId } }, owner: {}, editors: {}, events: {} },
        });
        const board = boards?.[0];
        if (!board) return json(res, 404, { error: 'Board not found' });
        return json(res, 200, {
          board: boardJson(board, owner.id),
          events: (board.events || []).map(eventJson),
        });
      }

      case 'boards.update': {
        const fields = restBoardFields(body, { partial: true });
        if (!Object.keys(fields).length) {
          return json(res, 400, { error: 'No editable fields in body' });
        }
        await scoped.transact(db.tx.boards[params.boardId].update(fields));
        const { boards } = await scoped.query({
          boards: { $: { where: { id: params.boardId } }, owner: {}, editors: {} },
        });
        return json(res, 200, { board: boardJson(boards[0], owner.id) });
      }

      case 'boards.delete': {
        await scoped.transact(db.tx.boards[params.boardId].delete());
        return json(res, 200, { ok: true });
      }

      case 'events.list': {
        const { events } = await scoped.query({
          events: { $: { where: { 'board.id': params.boardId } }, board: {} },
        });
        return json(res, 200, { events: (events || []).map(eventJson) });
      }

      case 'events.create': {
        const eid = id();
        await scoped.transact(
          db.tx.events[eid]
            .update({ ...eventFields(body), createdAt: Date.now() })
            .link({ board: params.boardId }),
        );
        const { events } = await scoped.query({
          events: { $: { where: { id: eid } }, board: {} },
        });
        return json(res, 201, { event: eventJson(events[0]) });
      }

      case 'events.get':
      case 'events.update': {
        const { events } = await scoped.query({
          events: { $: { where: { id: params.eventId } }, board: {} },
        });
        const existing = events?.[0];
        if (!existing) return json(res, 404, { error: 'Event not found' });
        if (route.name === 'events.get') {
          return json(res, 200, { event: eventJson(existing) });
        }
        // Merge onto the stored row, then re-normalize (clamped day/start/dur,
        // palette-checked color) so partial patches keep app invariants.
        const patch = {};
        for (const k of ['day', 'title', 'start', 'dur', 'color', 'memo']) {
          if (body[k] !== undefined) patch[k] = body[k];
        }
        if (!Object.keys(patch).length) {
          return json(res, 400, { error: 'No editable fields in body' });
        }
        const merged = eventFields({ ...existing, ...patch });
        await scoped.transact(db.tx.events[params.eventId].update(merged));
        return json(res, 200, { event: eventJson({ ...existing, ...merged }) });
      }

      case 'events.delete': {
        await scoped.transact(db.tx.events[params.eventId].delete());
        return json(res, 200, { ok: true });
      }

      case 'todos.list': {
        const day = query.get('day');
        if (day && !isPlannerDay(day)) {
          return json(res, 400, { error: 'day must be YYYY-MM-DD' });
        }
        const { todos } = await scoped.query({
          todos: day ? { $: { where: { day } } } : {},
        });
        return json(res, 200, { todos: (todos || []).map(todoJson) });
      }

      case 'todos.create': {
        if (!isPlannerDay(body.day) || typeof body.eventId !== 'string' || !body.eventId) {
          return json(res, 400, { error: 'day (YYYY-MM-DD) and eventId are required' });
        }
        const tid = id();
        await scoped.transact(
          db.tx.todos[tid]
            .update({ day: body.day, eventId: body.eventId, createdAt: Date.now() })
            .link({ owner: owner.id }),
        );
        return json(res, 201, { todo: todoJson({ id: tid, ...body, createdAt: Date.now() }) });
      }

      case 'todos.delete': {
        await scoped.transact(db.tx.todos[params.todoId].delete());
        return json(res, 200, { ok: true });
      }

      case 'token.refresh': {
        // Rotate the calling token: same row, new secret. The old value stops
        // working immediately; the response is the only time the new one is shown.
        const token = generateApiToken();
        const newHash = await hashApiToken(token);
        await db.transact(
          db.tx.apiTokens[tokenRow.id].update({
            hash: newHash,
            prefix: apiTokenPrefixOf(token),
            lastUsedAt: Date.now(),
          }),
        );
        return json(res, 200, { id: tokenRow.id, token, prefix: apiTokenPrefixOf(token) });
      }

      default:
        return json(res, 404, { error: 'No such endpoint' });
    }
  } catch (err) {
    if (err instanceof RestValidationError) {
      return json(res, 400, { error: err.message });
    }
    const status = instantErrorStatus(err);
    if (status === 500) console.error('rest api failed', err);
    return json(res, status, {
      error:
        status === 403
          ? 'Not allowed'
          : status === 404
            ? 'Not found'
            : status === 429
              ? 'Rate limit exceeded'
              : status === 400
                ? 'Invalid request'
                : 'Internal error',
    });
  }
}
