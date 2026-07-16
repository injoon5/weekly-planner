import { describe, expect, it } from 'vitest';
import {
  deriveShareAccessState,
  openShareSecret,
  sharedNotFound,
} from '../src/share-access.js';

describe('shared board guest access', () => {
  it('issues an open-link secret before share metadata arrives', () => {
    expect(openShareSecret('abc12345', null)).toBe('abc12345');
  });

  it('withholds secret for password shares until unlock', () => {
    expect(openShareSecret('abc12345', { mode: 'password', enabled: true })).toBe('');
  });

  it('treats a finished board query with no board as not found', () => {
    expect(
      sharedNotFound({
        token: 'abc12345',
        metaLoading: false,
        share: { mode: 'open', enabled: true },
        board: null,
        secret: 'abc12345',
        waitingUnlock: false,
        boardLoading: false,
      }),
    ).toBe(true);
  });

  it('keeps waiting while the board query is still loading', () => {
    expect(
      sharedNotFound({
        token: 'abc12345',
        metaLoading: false,
        share: { mode: 'open', enabled: true },
        board: null,
        secret: 'abc12345',
        waitingUnlock: false,
        boardLoading: true,
      }),
    ).toBe(false);
  });

  it('does not 404 while the password gate is active', () => {
    expect(
      sharedNotFound({
        token: 'abc12345',
        metaLoading: false,
        share: { mode: 'password', enabled: true },
        board: null,
        secret: '',
        waitingUnlock: true,
        boardLoading: false,
      }),
    ).toBe(false);
  });

  it('names password-required and unlock-failed states explicitly', () => {
    expect(
      deriveShareAccessState({
        token: 'abc12345',
        share: { mode: 'password', enabled: true, role: 'viewer' },
        board: null,
        metaLoading: false,
        boardLoading: false,
        manualSecret: '',
      }).state,
    ).toBe('passwordRequired');

    expect(
      deriveShareAccessState({
        token: 'abc12345',
        share: { mode: 'password', enabled: true, role: 'viewer' },
        board: null,
        metaLoading: false,
        boardLoading: false,
        manualSecret: 'bad-hash',
      }).state,
    ).toBe('unlockFailed');
  });
});
