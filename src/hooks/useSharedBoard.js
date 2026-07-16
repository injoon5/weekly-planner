import { useMemo, useState } from 'react';
import { db } from '../instant.js';
import { fromInstantEvents } from '../models.js';
import { deriveShareAccessState } from '../share-access.js';
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
  const accessPreview = deriveShareAccessState({
    token,
    share,
    board: null,
    metaLoading: meta.isLoading,
    boardLoading: false,
    manualSecret,
    unlockError,
    queryError: meta.error,
  });
  const secret = accessPreview.secret;

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
  const events = useMemo(() => fromInstantEvents(board?.events), [board]);
  const access = deriveShareAccessState({
    token,
    share,
    board,
    metaLoading: meta.isLoading,
    boardLoading: boardQ.isLoading,
    manualSecret,
    unlockError,
    queryError: meta.error || boardQ.error,
  });
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

  return {
    share,
    board,
    events,
    role: access.role,
    canEdit: access.canEdit,
    readOnly: !access.canEdit,
    ruleParams,
    state: access.state,
    needsPassword: access.needsPassword,
    password,
    setPassword,
    tryPassword,
    busy,
    unlockError: access.unlockError,
    isLoading: access.isLoading,
    error: access.error,
    notFound: access.notFound,
    disabled: access.disabled,
  };
}
