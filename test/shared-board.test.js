import { describe, expect, it } from 'vitest';

/** Mirrors useSharedBoard open-link secret + not-found gating. */
function openShareSecret(token, share) {
  if (!token) return '';
  if (!share || share.mode === 'open') return token;
  return '';
}

function sharedNotFound({
  token,
  metaLoading,
  share,
  board,
  secret,
  waitingUnlock,
  boardLoading,
}) {
  const boardPending = Boolean(secret) && !waitingUnlock;
  const boardMissing =
    boardPending &&
    !boardLoading &&
    !board &&
    Boolean(share?.enabled) &&
    !waitingUnlock;

  return (
    Boolean(token) &&
    !waitingUnlock &&
    ((!metaLoading && (!share || share.enabled === false) && !board) || boardMissing)
  );
}

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
});
