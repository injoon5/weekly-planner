import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../db/instant.js';
import { roleForBoard, shouldShowViewerBanner } from '../sharing/member-policy.js';
import { boardCoversDate, fromInstantEvents } from '../board/models.js';
import {
  isOptimisticBoardId,
  makeOptimisticBoard,
} from '../board/optimistic-board.js';
import {
  isPlannerSurfacePending,
  isWorkspaceColdBoot,
} from '../board/workspace-loading.js';
import { BOARD_ROLE } from '../sharing/roles.js';
import { isoDate } from '../lib/time.js';
import { ensureWorkspace } from '../board/workspace-ensure.js';

/**
 * Instant query + active board + one-shot workspace bootstrap.
 * Includes owned and member boards (via Instant view perms).
 *
 * Loading gates:
 * - Soft shell while the Instant list query is still empty/loading.
 * - Once the list settles empty, paint an optimistic board shell so guest
 *   create / cold seed don't wait on `ensureWorkspace` before chrome shows.
 * - Once a real list row exists, keep the planner shell mounted; detail/prefs
 *   hydrate into the surface without tearing down the header.
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
      (workspace.data?.boards || []).toSorted(
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
  const clearBootNote = useCallback(() => setBootNote(null), []);

  // Prefer the user's selection; otherwise open the schedule that covers today.
  const activeBoardId = useMemo(() => {
    if (!boards.length) return null;
    if (activeId && boards.some((b) => b.id === activeId)) return activeId;
    const today = isoDate();
    return (boards.find((b) => boardCoversDate(b, today)) || boards[0]).id;
  }, [boards, activeId]);

  // Lean detail: events + role links. Share rows / nested member users load
  // only when the Share popover opens (see ShareAction).
  const detail = db.useQuery(
    activeBoardId
      ? {
          boards: {
            $: { where: { id: activeBoardId } },
            owner: {},
            events: {},
            members: {},
            editors: {},
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

  const listBoard = boards.find((b) => b.id === activeBoardId) || null;
  const detailRow = detail.data?.boards?.[0] || null;
  // Instant can briefly keep the previous query result while the new where clause loads.
  const detailBoard = detailRow?.id === activeBoardId ? detailRow : null;

  // After the list query settles empty, paint a placeholder board while seed runs.
  const seeding = Boolean(user) && !workspace.isLoading && boards.length === 0 && !ready;
  const optimisticBoard = useMemo(
    () => (seeding ? makeOptimisticBoard(user) : null),
    [seeding, user],
  );

  // Prefer hydrated detail; fall back to list row, then optimistic seed shell.
  const board = detailBoard || listBoard || optimisticBoard;
  const isOptimistic = isOptimisticBoardId(board?.id);

  // Remap whenever the board row changes. Instant may keep the same `events`
  // array reference across patches; keying off `board` keeps titles/times fresh
  // for the grid and today's to-do list.
  const events = useMemo(
    () => (isOptimistic ? [] : fromInstantEvents(detailBoard?.events)),
    [detailBoard, isOptimistic],
  );
  const myRole = useMemo(() => roleForBoard(board, user?.id), [board, user?.id]);
  // Optimistic shell is read-only until the real board id lands.
  const canEdit =
    !isOptimistic && (myRole === BOARD_ROLE.OWNER || myRole === BOARD_ROLE.EDITOR);
  const isOwner = !isOptimistic && myRole === BOARD_ROLE.OWNER;
  const showViewerBanner = !isOptimistic && shouldShowViewerBanner(board, user?.id);

  const boardPrefs = prefsQuery.data?.boardPrefs?.[0] || null;
  const surfacePending = isPlannerSurfacePending({
    activeBoardId,
    hasDetailBoard: Boolean(detailBoard),
    hasListBoard: Boolean(listBoard || optimisticBoard),
  });
  // Cold boot only while Instant is still loading an empty list — optimistic
  // seed bypasses the spinner once the query has settled.
  const isLoading =
    isWorkspaceColdBoot({
      workspaceLoading: workspace.isLoading,
      ready,
      boardCount: boards.length,
    }) && !optimisticBoard;
  const error = workspace.error || detail.error || prefsQuery.error;

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
  }, [workspace.isLoading, user, user?.id, boards.length, settings, settings?.id]);

  return useMemo(
    () => ({
      user,
      boards,
      board,
      events,
      settings,
      boardPrefs,
      myRole,
      canEdit,
      isOwner,
      showViewerBanner,
      activeId: activeBoardId,
      setActiveId,
      isLoading,
      surfacePending,
      error,
      ready,
      bootNote,
      clearBootNote,
      isOptimistic,
    }),
    [
      user,
      boards,
      board,
      events,
      settings,
      boardPrefs,
      myRole,
      canEdit,
      isOwner,
      showViewerBanner,
      activeBoardId,
      isLoading,
      surfacePending,
      error,
      ready,
      bootNote,
      clearBootNote,
      isOptimistic,
    ],
  );
}
