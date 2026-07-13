import { afterEach, describe, expect, it, vi } from 'vitest';
import { isEditorRole, normalizeMemberRole } from '../src/member-role.js';
import { commitTransaction } from '../src/transaction.js';
import { workspaceBootstrapPlan } from '../src/workspace-bootstrap.js';

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

describe('transaction failures', () => {
  it('surfaces rejected transactions without reporting success', async () => {
    const error = new Error('denied');
    const onError = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const didCommit = await commitTransaction(
      vi.fn().mockRejectedValue(error),
      { operation: 'update' },
      { message: '저장 실패', onError },
    );

    expect(didCommit).toBe(false);
    expect(onError).toHaveBeenCalledWith('저장 실패', error);
  });
});
