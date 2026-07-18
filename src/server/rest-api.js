import { init, id } from '@instantdb/admin';
import {
  apiTokenLookupHashes,
  apiTokenPrefixOf,
  generateApiToken,
  hashApiToken,
  parseBearer,
} from './api-tokens.js';
import { linkedId, linkedIds } from '../lib/links.js';
import { eventFields, nextBoardSortOrder } from '../board/models.js';
import {
  RestValidationError,
  createRateLimiter,
  isPlannerDay,
  matchRestRoute,
  restBoardFields,
  restSegments,
} from './rest.js';
import { readBody, sendJson } from './http.js';
import schema from '../db/schema.js';

const APP_ID = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;
const API_TOKEN_PEPPER = process.env.API_TOKEN_PEPPER || '';

// Per-token bucket, same token-bucket semantics as Instant's own rate limits
// (https://www.instantdb.com/docs/rate-limits). Per-instance memory is fine
// here: it is a first line of defense in front of the $rateLimits buckets
// enforced by Instant's permission rules.
const limiter = createRateLimiter({ capacity: 120, refillPeriodMs: 60_000 });

/** Refresh `lastUsedAt` at most once a minute to avoid write amplification. */
const LAST_USED_STALE_MS = 60_000;

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
 * Entrypoint: `api/v1.js` via vercel.json rewrite of `/api/v1/*`.
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
    return sendJson(res, 204, {});
  }
  if (!APP_ID || !ADMIN_TOKEN) {
    return sendJson(res, 500, { error: 'Server is not configured' });
  }

  const route = matchRestRoute(req.method, restSegments(req.url));
  if (!route) {
    return sendJson(res, 404, { error: 'No such endpoint' });
  }

  const bearer = parseBearer(req.headers.authorization);
  if (!bearer) {
    return sendJson(res, 401, { error: 'Missing or malformed bearer token' }, {
      'WWW-Authenticate': 'Bearer realm="weekly-planner-api"',
    });
  }

  const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

  try {
    // Peppered hash first (when configured), then legacy unpeppered.
    const hashes = await apiTokenLookupHashes(bearer, API_TOKEN_PEPPER);
    const gate = limiter.take(hashes[0]);
    if (!gate.ok) {
      return sendJson(res, 429, { error: 'Rate limit exceeded' }, {
        'Retry-After': String(gate.retryAfterSec),
      });
    }

    let tokenRow = null;
    for (const hash of hashes) {
      const { apiTokens } = await db.query({
        apiTokens: { $: { where: { hash } }, owner: {} },
      });
      if (apiTokens?.[0]) {
        tokenRow = apiTokens[0];
        break;
      }
    }
    const owner = tokenRow?.owner;
    if (!tokenRow || !owner?.id || !owner.email) {
      return sendJson(res, 401, { error: 'Invalid token' });
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
        return sendJson(res, 400, { error: 'Request body must be JSON' });
      }
    }
    const query = new URL(req.url, 'http://localhost').searchParams;
    const { params } = route;

    switch (route.name) {
      case 'me.get': {
        return sendJson(res, 200, { id: owner.id, email: owner.email });
      }

      case 'boards.list': {
        const { boards } = await scoped.query({ boards: { owner: {}, editors: {} } });
        return sendJson(res, 200, {
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
        return sendJson(res, 201, { board: boardJson(created.boards[0], owner.id) });
      }

      case 'boards.get': {
        const { boards } = await scoped.query({
          boards: { $: { where: { id: params.boardId } }, owner: {}, editors: {}, events: {} },
        });
        const board = boards?.[0];
        if (!board) return sendJson(res, 404, { error: 'Board not found' });
        return sendJson(res, 200, {
          board: boardJson(board, owner.id),
          events: (board.events || []).map(eventJson),
        });
      }

      case 'boards.update': {
        const fields = restBoardFields(body, { partial: true });
        if (!Object.keys(fields).length) {
          return sendJson(res, 400, { error: 'No editable fields in body' });
        }
        await scoped.transact(db.tx.boards[params.boardId].update(fields));
        const { boards } = await scoped.query({
          boards: { $: { where: { id: params.boardId } }, owner: {}, editors: {} },
        });
        return sendJson(res, 200, { board: boardJson(boards[0], owner.id) });
      }

      case 'boards.delete': {
        await scoped.transact(db.tx.boards[params.boardId].delete());
        return sendJson(res, 200, { ok: true });
      }

      case 'events.list': {
        const { events } = await scoped.query({
          events: { $: { where: { 'board.id': params.boardId } }, board: {} },
        });
        return sendJson(res, 200, { events: (events || []).map(eventJson) });
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
        return sendJson(res, 201, { event: eventJson(events[0]) });
      }

      case 'events.get':
      case 'events.update': {
        const { events } = await scoped.query({
          events: { $: { where: { id: params.eventId } }, board: {} },
        });
        const existing = events?.[0];
        if (!existing) return sendJson(res, 404, { error: 'Event not found' });
        if (route.name === 'events.get') {
          return sendJson(res, 200, { event: eventJson(existing) });
        }
        // Merge onto the stored row, then re-normalize (clamped day/start/dur,
        // palette-checked color) so partial patches keep app invariants.
        const patch = {};
        for (const k of ['day', 'title', 'start', 'dur', 'color', 'memo']) {
          if (body[k] !== undefined) patch[k] = body[k];
        }
        if (!Object.keys(patch).length) {
          return sendJson(res, 400, { error: 'No editable fields in body' });
        }
        const merged = eventFields({ ...existing, ...patch });
        await scoped.transact(db.tx.events[params.eventId].update(merged));
        return sendJson(res, 200, { event: eventJson({ ...existing, ...merged }) });
      }

      case 'events.delete': {
        await scoped.transact(db.tx.events[params.eventId].delete());
        return sendJson(res, 200, { ok: true });
      }

      case 'todos.list': {
        const day = query.get('day');
        if (day && !isPlannerDay(day)) {
          return sendJson(res, 400, { error: 'day must be YYYY-MM-DD' });
        }
        const { todos } = await scoped.query({
          todos: day ? { $: { where: { day } } } : {},
        });
        return sendJson(res, 200, { todos: (todos || []).map(todoJson) });
      }

      case 'todos.create': {
        if (!isPlannerDay(body.day) || typeof body.eventId !== 'string' || !body.eventId) {
          return sendJson(res, 400, { error: 'day (YYYY-MM-DD) and eventId are required' });
        }
        const tid = id();
        await scoped.transact(
          db.tx.todos[tid]
            .update({ day: body.day, eventId: body.eventId, createdAt: Date.now() })
            .link({ owner: owner.id }),
        );
        return sendJson(res, 201, { todo: todoJson({ id: tid, ...body, createdAt: Date.now() }) });
      }

      case 'todos.delete': {
        await scoped.transact(db.tx.todos[params.todoId].delete());
        return sendJson(res, 200, { ok: true });
      }

      case 'token.refresh': {
        // Rotate the calling token: same row, new secret. The old value stops
        // working immediately; the response is the only time the new one is shown.
        const token = generateApiToken();
        const newHash = await hashApiToken(token, API_TOKEN_PEPPER);
        await db.transact(
          db.tx.apiTokens[tokenRow.id].update({
            hash: newHash,
            prefix: apiTokenPrefixOf(token),
            lastUsedAt: Date.now(),
          }),
        );
        return sendJson(res, 200, { id: tokenRow.id, token, prefix: apiTokenPrefixOf(token) });
      }

      default:
        return sendJson(res, 404, { error: 'No such endpoint' });
    }
  } catch (err) {
    if (err instanceof RestValidationError) {
      return sendJson(res, 400, { error: err.message });
    }
    const status = instantErrorStatus(err);
    if (status === 500) console.error('rest api failed', err);
    return sendJson(res, status, {
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
