import { describe, expect, it } from 'vitest';
import {
  API_TOKEN_PREFIX,
  apiTokenLookupHashes,
  apiTokenName,
  apiTokenPrefixOf,
  generateApiToken,
  hashApiToken,
  isApiTokenShape,
  parseBearer,
} from '../src/server/api-tokens.js';
import {
  RestValidationError,
  createRateLimiter,
  isPlannerDay,
  matchRestRoute,
  restBoardFields,
  restSegments,
} from '../src/server/rest.js';

describe('api tokens', () => {
  it('generates prefixed hex tokens that pass the shape check', () => {
    const token = generateApiToken();
    expect(token.startsWith(API_TOKEN_PREFIX)).toBe(true);
    expect(isApiTokenShape(token)).toBe(true);
    expect(generateApiToken()).not.toBe(token);
  });

  it('rejects malformed tokens', () => {
    expect(isApiTokenShape('')).toBe(false);
    expect(isApiTokenShape('wp_short')).toBe(false);
    expect(isApiTokenShape('sk_' + 'a'.repeat(48))).toBe(false);
    expect(isApiTokenShape('wp_' + 'Z'.repeat(48))).toBe(false);
  });

  it('hashes deterministically and never stores the plaintext', async () => {
    const token = generateApiToken();
    const a = await hashApiToken(token);
    const b = await hashApiToken(token);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain(token.slice(3));
  });

  it('peppers the hash when a pepper is provided', async () => {
    const token = generateApiToken();
    const plain = await hashApiToken(token);
    const peppered = await hashApiToken(token, 's3cret');
    expect(peppered).not.toBe(plain);
    expect(peppered).toBe(await hashApiToken(token, 's3cret'));
  });

  it('lookup hashes prefer peppered then legacy', async () => {
    const token = generateApiToken();
    const withPepper = await apiTokenLookupHashes(token, 'pep');
    expect(withPepper).toEqual([
      await hashApiToken(token, 'pep'),
      await hashApiToken(token, ''),
    ]);
    const legacyOnly = await apiTokenLookupHashes(token, '');
    expect(legacyOnly).toEqual([await hashApiToken(token, '')]);
  });

  it('keeps a short display prefix', () => {
    const token = 'wp_ab12cd34' + 'e'.repeat(40);
    expect(apiTokenPrefixOf(token)).toBe('wp_ab12cd34');
  });

  it('normalizes token names', () => {
    expect(apiTokenName('  my bot  ')).toBe('my bot');
    expect(apiTokenName('x'.repeat(80))).toHaveLength(40);
    expect(apiTokenName(42)).toBe('');
  });

  it('parses only well-formed bearer headers', () => {
    const token = generateApiToken();
    expect(parseBearer(`Bearer ${token}`)).toBe(token);
    expect(parseBearer(`bearer ${token}`)).toBe(token);
    expect(parseBearer(token)).toBe(null);
    expect(parseBearer('Bearer nope')).toBe(null);
    expect(parseBearer(undefined)).toBe(null);
  });
});

describe('rest routing', () => {
  it('extracts segments only under /api/v1', () => {
    expect(restSegments('/api/v1')).toEqual([]);
    expect(restSegments('/api/v1/boards/abc/events?x=1')).toEqual(['boards', 'abc', 'events']);
    expect(restSegments('/api/v1/todos?day=2026-07-17')).toEqual(['todos']);
    expect(restSegments('/api/invite')).toBe(null);
    expect(restSegments('/api/v2/boards')).toBe(null);
  });

  it('matches the route table', () => {
    expect(matchRestRoute('GET', ['me'])).toEqual({ name: 'me.get', params: {} });
    expect(matchRestRoute('GET', ['boards'])).toEqual({ name: 'boards.list', params: {} });
    expect(matchRestRoute('POST', ['boards'])).toEqual({ name: 'boards.create', params: {} });
    expect(matchRestRoute('PATCH', ['boards', 'b1'])).toEqual({
      name: 'boards.update',
      params: { boardId: 'b1' },
    });
    expect(matchRestRoute('POST', ['boards', 'b1', 'events'])).toEqual({
      name: 'events.create',
      params: { boardId: 'b1' },
    });
    expect(matchRestRoute('DELETE', ['events', 'e1'])).toEqual({
      name: 'events.delete',
      params: { eventId: 'e1' },
    });
    expect(matchRestRoute('POST', ['todos'])).toEqual({ name: 'todos.create', params: {} });
    expect(matchRestRoute('POST', ['token', 'refresh'])).toEqual({
      name: 'token.refresh',
      params: {},
    });
  });

  it('rejects unknown paths and methods', () => {
    expect(matchRestRoute('GET', null)).toBe(null);
    expect(matchRestRoute('PUT', ['boards', 'b1'])).toBe(null);
    expect(matchRestRoute('GET', ['boards', 'b1', 'members'])).toBe(null);
    expect(matchRestRoute('PATCH', ['todos', 't1'])).toBe(null);
    expect(matchRestRoute('GET', ['token', 'refresh'])).toBe(null);
  });
});

describe('rest board fields', () => {
  it('defaults and trims on create', () => {
    expect(restBoardFields({})).toEqual({ name: '시간표' });
    expect(restBoardFields({ name: '  2학기  ', from: '2026-09-01' })).toEqual({
      name: '2학기',
      from: '2026-09-01',
    });
  });

  it('keeps only provided fields on partial update', () => {
    expect(restBoardFields({ repeatEvery: 2 }, { partial: true })).toEqual({ repeatEvery: 2 });
    expect(restBoardFields({}, { partial: true })).toEqual({});
  });

  it('validates dates and repeat cadence', () => {
    expect(() => restBoardFields({ from: 'next week' })).toThrow(RestValidationError);
    expect(() => restBoardFields({ repeatEvery: 99 })).toThrow(RestValidationError);
    expect(() => restBoardFields({ repeatEvery: -1 })).toThrow(RestValidationError);
    expect(restBoardFields({ to: '' })).toEqual({ name: '시간표', to: '' });
  });

  it('validates planner days for todos', () => {
    expect(isPlannerDay('2026-07-17')).toBe(true);
    expect(isPlannerDay('2026-7-17')).toBe(false);
    expect(isPlannerDay(20260717)).toBe(false);
  });
});

describe('rate limiter', () => {
  it('spends capacity then rejects with a retry hint', () => {
    let t = 0;
    const limiter = createRateLimiter({
      capacity: 2,
      refillPeriodMs: 60_000,
      now: () => t,
    });
    expect(limiter.take('k').ok).toBe(true);
    expect(limiter.take('k').ok).toBe(true);
    const denied = limiter.take('k');
    expect(denied.ok).toBe(false);
    expect(denied.retryAfterSec).toBeGreaterThan(0);
  });

  it('refills greedily over time and keys buckets independently', () => {
    let t = 0;
    const limiter = createRateLimiter({
      capacity: 2,
      refillPeriodMs: 60_000,
      now: () => t,
    });
    limiter.take('a');
    limiter.take('a');
    expect(limiter.take('b').ok).toBe(true);
    expect(limiter.take('a').ok).toBe(false);
    t += 30_000; // half the period → one token back
    expect(limiter.take('a').ok).toBe(true);
    expect(limiter.take('a').ok).toBe(false);
  });
});
