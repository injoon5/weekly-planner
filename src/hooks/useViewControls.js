import { useCallback, useEffect, useMemo, useState } from 'react';
import { COLOR_LABELS_KO, PALETTE } from '../config.js';
import { db, patchBoardTx, upsertBoardPrefsTx } from '../db.js';
import {
  defaultViewPrefs,
  parseColorLabels,
  prefsFromDoc,
  serializeColorLabels,
  serializeHiddenColors,
} from '../prefs.js';

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
  const [labelDrafts, setLabelDrafts] = useState(labelsFromBoard);

  useEffect(() => {
    setLabelDrafts(labelsFromBoard);
  }, [labelsFromBoard]);

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
    (patch) => {
      if (!user || !boardId) return;
      const tx = upsertBoardPrefsTx(boardPrefs?.id, user.id, boardId, patch);
      if (tx) db.transact(tx);
    },
    [user, boardId, boardPrefs?.id],
  );

  const applyPrefs = useCallback(
    (partial) => {
      const next = {
        hiddenColors: partial.hiddenColors ?? hiddenColors,
        hideWeekend: partial.hideWeekend ?? hideWeekend,
        compact: partial.compact ?? compact,
        showMemos: partial.showMemos ?? showMemos,
      };

      if (!user) {
        setGuestPrefs(next);
        writeGuestPrefs(storageKey || boardId, next);
        return;
      }

      persistRemote({
        hiddenColors: serializeHiddenColors(next.hiddenColors),
        hideWeekend: next.hideWeekend,
        compact: next.compact,
        showMemos: next.showMemos,
      });
    },
    [hiddenColors, hideWeekend, compact, showMemos, user, storageKey, boardId, persistRemote],
  );

  const toggleColor = (color) => {
    const next = hiddenColors.includes(color)
      ? hiddenColors.filter((c) => c !== color)
      : [...hiddenColors, color];
    applyPrefs({ hiddenColors: next });
  };

  const colorLabel = (color) => labelDrafts[color] || COLOR_LABELS_KO[color] || color;

  const setColorLabel = (color, label) => {
    if (!canRenameColors || !boardId) return;
    const next = { ...labelDrafts, [color]: label };
    if (!label.trim()) delete next[color];
    setLabelDrafts(next);
    const tx = patchBoardTx(boardId, { colorLabels: serializeColorLabels(next) });
    if (tx) db.transact(tx);
  };

  const visibleEvents = useCallback(
    (events) => events.filter((e) => !hiddenColors.includes(e.color)),
    [hiddenColors],
  );

  const days = useMemo(() => {
    if (!hideWeekend) return [0, 1, 2, 3, 4, 5, 6];
    return [1, 2, 3, 4, 5];
  }, [hideWeekend]);

  return {
    palette: PALETTE,
    hiddenColors,
    hideWeekend,
    compact,
    showMemos,
    days,
    colorLabel,
    setColorLabel,
    toggleColor,
    setHideWeekend: (v) => applyPrefs({ hideWeekend: v }),
    setCompact: (v) => applyPrefs({ compact: v }),
    setShowMemos: (v) => applyPrefs({ showMemos: v }),
    visibleEvents,
    canRenameColors: Boolean(canRenameColors),
  };
}
