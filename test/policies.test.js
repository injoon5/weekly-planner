import { afterEach, describe, expect, it, vi } from 'vitest';
import { isOk } from '../src/lib/command-result.js';
import { linkedId, linkedIds } from '../src/lib/links.js';
import {
  isEditorRole,
  normalizeMemberRole,
  normalizeShareMode,
  normalizeShareRole,
  SHARE_MODE,
  SHARE_ROLE,
} from '../src/sharing/roles.js';
import { commitTransaction } from '../src/db/transaction.js';
import { workspaceBootstrapPlan } from '../src/board/workspace-bootstrap.js';

afterEach(() => vi.restoreAllMocks());

describe('workspace bootstrap policy', () => {
  it('does not seed a demo board when a member board is already accessible', () => {
    expect(workspaceBootstrapPlan({ accessibleBoardCount: 1, hasSettings: false })).toEqual({
      shouldSeedBoard: false,
      shouldCreateSettings: true,
    });
  });

  it('seeds only an empty workspace and creates only missing settings', () => {
    expect(workspaceBootstrapPlan({ accessibleBoardCount: 0, hasSettings: true })).toEqual({
      shouldSeedBoard: true,
      shouldCreateSettings: false,
    });
    expect(workspaceBootstrapPlan({ accessibleBoardCount: 2, hasSettings: true })).toEqual({
      shouldSeedBoard: false,
      shouldCreateSettings: false,
    });
  });
});

describe('member role policy', () => {
  it('normalizes unknown roles to viewer and editor authority explicitly', () => {
    expect(normalizeMemberRole('editor')).toBe('editor');
    expect(normalizeMemberRole('owner')).toBe('viewer');
    expect(isEditorRole('editor')).toBe(true);
    expect(isEditorRole('viewer')).toBe(false);
  });
});

describe('share contracts', () => {
  it('normalizes share mode and role to closed unions', () => {
    expect(normalizeShareMode('password')).toBe(SHARE_MODE.PASSWORD);
    expect(normalizeShareMode('weird')).toBe(SHARE_MODE.OPEN);
    expect(normalizeShareRole('editor')).toBe(SHARE_ROLE.EDITOR);
    expect(normalizeShareRole('admin')).toBe(SHARE_ROLE.VIEWER);
  });
});

describe('linkedId', () => {
  it('accepts Instant row objects or bare ids', () => {
    expect(linkedId({ id: 'u1' })).toBe('u1');
    expect(linkedId('u2')).toBe('u2');
    expect(linkedId(null)).toBe(null);
    expect(linkedIds([{ id: 'a' }, 'b', null])).toEqual(['a', 'b']);
  });
});

describe('transaction failures', () => {
  it('surfaces rejected transactions without reporting success', async () => {
    const error = new Error('denied');
    const onError = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await commitTransaction(
      vi.fn().mockRejectedValue(error),
      { operation: 'update' },
      { message: '저장 실패', onError },
    );

    expect(isOk(result)).toBe(false);
    expect(result.message).toBe('저장 실패');
    expect(onError).toHaveBeenCalledWith('저장 실패', error);
  });

  it('returns ok on success', async () => {
    const result = await commitTransaction(vi.fn().mockResolvedValue(undefined), { op: 1 });
    expect(result).toEqual({ ok: true });
  });
});
