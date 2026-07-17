import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/instant.js';
import { roleForBoard } from '../sharing/member-policy.js';
import { boardCoversDate, fromInstantEvents } from '../board/models.js';
import { BOARD_ROLE } from '../sharing/roles.js';
import { isoDate } from '../lib/time.js';
import { ensureWorkspace } from '../board/workspace-ensure.js';

/**
 * Instant query + active board + one-shot workspace bootstrap.
 * Includes owned and member boards (via Instant view perms).
 */
export function useWorkspace() {
  const user = db.useUser();
  const workspace = db.useQuery({
    boards: {
      owner: {},
    },
    settings: {},
  });

  const boards = useMemo(
    () =>
      [...(workspace.data?.boards || [])].sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          (a.createdAt ?? 0) - (b.createdAt ?? 0),
      ),
    [workspace.data?.boards],
  );
  const settings = workspace.data?.settings?.[0] || null;

  const [activeId, setActiveId] = useState(null);
  const [ready, setReady] = useState(false);
  const [bootNote, setBootNote] = useState(null);

  const activeBoardId =
    boards.find((candidate) => candidate.id === activeId)?.id || boards[0]?.id || null;
  const detail = db.useQuery(
    activeBoardId
      ? {
          boards: {
            $: { where: { id: activeBoardId } },
            owner: {},
            events: {},
            members: { user: {} },
            editors: {},
            shares: {},
          },
        }
      : null,
  );
  const prefsQuery = db.useQuery(
    activeBoardId && user?.id
      ? {
          boardPrefs: {
            $: {
              where: {
                'board.id': activeBoardId,
                'user.id': user.id,
              },
            },
            board: {},
            user: {},
          },
        }
      : null,
  );
  const board = detail.data?.boards?.[0] || null;
  // Remap whenever the board row changes. Instant may keep the same `events`
  // array reference across patches; keying off `board` keeps titles/times fresh
  // for the grid and today's to-do list.
  const events = useMemo(() => fromInstantEvents(board?.events), [board]);
  const myRole = useMemo(() => roleForBoard(board, user?.id), [board, user?.id]);
  const canEdit = myRole === BOARD_ROLE.OWNER || myRole === BOARD_ROLE.EDITOR;
  const isOwner = myRole === BOARD_ROLE.OWNER;

  const boardPrefs = prefsQuery.data?.boardPrefs?.[0] || null;

  useEffect(() => {
    if (!boards.length) {
      setActiveId(null);
      return;
    }
    if (boards.some((b) => b.id === activeId)) return;
    // No selection yet (or it vanished): open the schedule whose period
    // covers today, falling back to the first board.
    const today = isoDate();
    const current = boards.find((b) => boardCoversDate(b, today)) || boards[0];
    setActiveId(current.id);
  }, [boards, activeId]);

  useEffect(() => {
    if (workspace.isLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await ensureWorkspace(user, {
          accessibleBoardCount: boards.length,
          hasSettings: Boolean(settings),
        });
        if (cancelled) return;
        if (result.migrated) setBootNote('이 기기의 시간표를 계정으로 옮겼어요');
      } catch (ex) {
        console.error(ex);
        if (!cancelled) setBootNote('초기 시간표를 만들지 못했어요');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace.isLoading, user?.id, boards.length, settings?.id]);

  return {
    user,
    boards,
    board,
    events,
    settings,
    boardPrefs,
    myRole,
    canEdit,
    isOwner,
    activeId,
    setActiveId,
    isLoading:
      workspace.isLoading ||
      Boolean(activeBoardId && detail.isLoading) ||
      Boolean(activeBoardId && user?.id && prefsQuery.isLoading),
    error: workspace.error || detail.error || prefsQuery.error,
    ready,
    bootNote,
    clearBootNote: () => setBootNote(null),
  };
}
