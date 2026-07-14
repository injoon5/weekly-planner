import { useMemo, useState } from 'react';
import { db } from '../db.js';
import { fromInstantEvents } from '../models.js';
import {
  hashSharePassword,
  readShareUnlock,
  writeShareUnlock,
} from '../share.js';

/**
 * Public share route: metadata by token, board via ruleParams.secret.
 */
export function useSharedBoard(token) {
  const saved = token ? readShareUnlock(token) : '';
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualSecret, setManualSecret] = useState(saved);

  const meta = db.useQuery(
    token
      ? {
          shares: {
            $: { where: { token } },
          },
        }
      : null,
    token ? { ruleParams: { shareToken: token } } : undefined,
  );

  const share = meta.data?.shares?.[0] || null;
  const needsPassword = share?.mode === 'password';

  const openSecret = token && (!share || share.mode === 'open') ? token : '';
  const secret = manualSecret || openSecret;

  // Resolve board via the share token — guests can't load nested `board: {}`
  // on the share row (no board view perms yet), so don't depend on boardId.
  const boardQ = db.useQuery(
    token && secret
      ? {
          boards: {
            $: { where: { 'shares.token': token } },
            events: {},
            shares: {},
          },
        }
      : null,
    secret ? { ruleParams: { shareToken: token, secret } } : undefined,
  );

  const board = boardQ.data?.boards?.[0] || null;
  const events = useMemo(() => fromInstantEvents(board?.events), [board?.events]);
  const role = share?.role === 'editor' ? 'editor' : 'viewer';
  const canEdit = Boolean(board) && role === 'editor';
  const ruleParams = secret ? { secret } : null;

  const tryPassword = async () => {
    if (!token || !password.trim()) return;
    setBusy(true);
    setUnlockError('');
    try {
      const hashed = await hashSharePassword(token, password.trim());
      writeShareUnlock(token, hashed);
      setManualSecret(hashed);
    } catch {
      setUnlockError('잠금 해제에 실패했어요');
    } finally {
      setBusy(false);
    }
  };

  const waitingUnlock = Boolean(needsPassword) && !manualSecret;
  const passwordFailed =
    Boolean(needsPassword) &&
    Boolean(manualSecret) &&
    !boardQ.isLoading &&
    !board &&
    Boolean(share?.enabled);

  const boardPending = Boolean(secret) && !waitingUnlock;
  const isLoading =
    Boolean(token) &&
    (meta.isLoading || (boardPending && boardQ.isLoading && !board));

  const boardMissing =
    boardPending &&
    !boardQ.isLoading &&
    !board &&
    Boolean(share?.enabled) &&
    !waitingUnlock;

  return {
    share,
    board,
    events,
    role,
    canEdit,
    readOnly: !canEdit,
    ruleParams,
    needsPassword: waitingUnlock,
    password,
    setPassword,
    tryPassword,
    busy,
    unlockError: unlockError || (passwordFailed ? '비밀번호가 맞지 않아요' : ''),
    isLoading,
    error: meta.error || boardQ.error,
    notFound:
      Boolean(token) &&
      !waitingUnlock &&
      ((!meta.isLoading && (!share || share.enabled === false) && !board) || boardMissing),
    disabled: share && share.enabled === false,
  };
}
