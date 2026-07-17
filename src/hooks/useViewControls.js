import { useCallback, useEffect, useMemo, useState } from 'react';
import { isOk } from '../lib/command-result.js';
import { COLOR_LABELS_KO, PALETTE } from '../lib/config.js';
import { toast } from '../lib/notify.js';
import { db } from '../db/instant.js';
import {
  defaultViewPrefs,
  parseColorLabels,
  prefsFromDoc,
  serializeColorLabels,
  serializeHiddenColors,
} from '../board/prefs.js';
import { commitTransaction } from '../db/transaction.js';
import { patchBoardTx } from '../db/tx/boards.js';
import { upsertBoardPrefsTx } from '../db/tx/prefs.js';

const guestKey = (boardKey) => `weekly-planner.view.${boardKey || 'guest'}`;

function readGuestPrefs(boardKey) {
  try {
    const raw = sessionStorage.getItem(guestKey(boardKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeGuestPrefs(boardKey, prefs) {
  try {
    sessionStorage.setItem(guestKey(boardKey), JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/**
 * Synced board view prefs for signed-in users; sessionStorage for share guests.
 * Color labels live on the board document.
 * Local React state mirrors Instant/session — Instant is source of truth when signed in.
 */
export function useViewControls({
  board,
  boardPrefs,
  user,
  canRenameColors,
  storageKey,
}) {
  const boardId = board?.id;
  const labelsFromBoard = useMemo(() => parseColorLabels(board?.colorLabels), [board?.colorLabels]);

  const remotePrefs = useMemo(() => {
    if (user && boardPrefs) return prefsFromDoc(boardPrefs);
    if (user) return defaultViewPrefs();
    return null;
  }, [user, boardPrefs]);

  const [guestPrefs, setGuestPrefs] = useState(() =>
    user ? null : prefsFromDoc(readGuestPrefs(storageKey || boardId)),
  );

  useEffect(() => {
    if (user) {
      setGuestPrefs(null);
      return;
    }
    setGuestPrefs(prefsFromDoc(readGuestPrefs(storageKey || boardId)));
  }, [user, boardId, storageKey]);

  const prefs = remotePrefs || guestPrefs || defaultViewPrefs();
  const { hiddenColors, hideWeekend, compact, showMemos } = prefs;

  const persistRemote = useCallback(
    async (patch) => {
      if (!user || !boardId) return false;
      const tx = upsertBoardPrefsTx(boardPrefs?.id, user.id, boardId, patch);
      if (!tx) return true;
      return isOk(
        await commitTransaction((transaction) => db.transact(transaction), tx, {
          message: '보기 설정을 저장하지 못했어요',
          onError: toast,
        }),
      );
    },
    [user, boardId, boardPrefs?.id],
  );

  const applyPrefs = useCallback(
    async (partial) => {
      const next = {
        hiddenColors: partial.hiddenColors ?? hiddenColors,
        hideWeekend: partial.hideWeekend ?? hideWeekend,
        compact: partial.compact ?? compact,
        showMemos: partial.showMemos ?? showMemos,
      };

      if (!user) {
        setGuestPrefs(next);
        writeGuestPrefs(storageKey || boardId, next);
        return true;
      }

      return await persistRemote({
        hiddenColors: serializeHiddenColors(next.hiddenColors),
        hideWeekend: next.hideWeekend,
        compact: next.compact,
        showMemos: next.showMemos,
      });
    },
    [hiddenColors, hideWeekend, compact, showMemos, user, storageKey, boardId, persistRemote],
  );

  const toggleColor = useCallback(
    (color) => {
      const next = hiddenColors.includes(color)
        ? hiddenColors.filter((c) => c !== color)
        : [...hiddenColors, color];
      applyPrefs({ hiddenColors: next });
    },
    [hiddenColors, applyPrefs],
  );

  const colorLabel = useCallback(
    (color) => labelsFromBoard[color] || COLOR_LABELS_KO[color] || color,
    [labelsFromBoard],
  );

  const setColorLabel = useCallback(
    async (color, label) => {
      if (!canRenameColors || !boardId) return false;
      const next = { ...labelsFromBoard, [color]: label };
      if (!label.trim()) delete next[color];
      const tx = patchBoardTx(boardId, { colorLabels: serializeColorLabels(next) });
      if (!tx) return true;
      return isOk(
        await commitTransaction((transaction) => db.transact(transaction), tx, {
          message: '색상 이름을 저장하지 못했어요',
          onError: toast,
        }),
      );
    },
    [canRenameColors, boardId, labelsFromBoard],
  );

  const hiddenColorSet = useMemo(() => new Set(hiddenColors), [hiddenColors]);

  const visibleEvents = useCallback(
    (events) => events.filter((e) => !hiddenColorSet.has(e.color)),
    [hiddenColorSet],
  );

  const days = useMemo(() => {
    if (!hideWeekend) return [0, 1, 2, 3, 4, 5, 6];
    return [1, 2, 3, 4, 5];
  }, [hideWeekend]);

  const setHideWeekend = useCallback((v) => applyPrefs({ hideWeekend: v }), [applyPrefs]);
  const setCompact = useCallback((v) => applyPrefs({ compact: v }), [applyPrefs]);
  const setShowMemos = useCallback((v) => applyPrefs({ showMemos: v }), [applyPrefs]);

  return useMemo(
    () => ({
      palette: PALETTE,
      hiddenColors,
      hideWeekend,
      compact,
      showMemos,
      days,
      canRenameColors: Boolean(canRenameColors),
      toggleColor,
      setHideWeekend,
      setCompact,
      setShowMemos,
      colorLabel,
      setColorLabel,
      visibleEvents,
    }),
    [
      hiddenColors,
      hideWeekend,
      compact,
      showMemos,
      days,
      canRenameColors,
      toggleColor,
      setHideWeekend,
      setCompact,
      setShowMemos,
      colorLabel,
      setColorLabel,
      visibleEvents,
    ],
  );
}
