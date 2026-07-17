import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/instant.js';
import { roleForBoard, shouldShowViewerBanner } from '../sharing/member-policy.js';
import { boardCoversDate, fromInstantEvents } from '../board/models.js';
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
 * - Soft shell (header + surface pending) while the board list is empty and
 *   still loading or bootstrap has not finished — never a full-viewport blank.
 * - Once a list row exists, keep the planner shell mounted; detail/prefs can
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

  // Prefer the user's selection; otherwise open the schedule that covers today.
  const activeBoardId = useMemo(() => {
    if (!boards.length) return null;
    if (activeId && boards.some((b) => b.id === activeId)) return activeId;
    const today = isoDate();
    return (boards.find((b) => boardCoversDate(b, today)) || boards[0]).id;
  }, [boards, activeId]);
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

  const listBoard = boards.find((b) => b.id === activeBoardId) || null;
  const detailRow = detail.data?.boards?.[0] || null;
  // Instant can briefly keep the previous query result while the new where clause loads.
  const detailBoard = detailRow?.id === activeBoardId ? detailRow : null;
  // Prefer hydrated detail; fall back to the list row so chrome can paint early.
  const board = detailBoard || listBoard;
  // Remap whenever the board row changes. Instant may keep the same `events`
  // array reference across patches; keying off `board` keeps titles/times fresh
  // for the grid and today's to-do list.
  const events = useMemo(() => fromInstantEvents(detailBoard?.events), [detailBoard]);
  const myRole = useMemo(() => roleForBoard(board, user?.id), [board, user?.id]);
  const canEdit = myRole === BOARD_ROLE.OWNER || myRole === BOARD_ROLE.EDITOR;
  const isOwner = myRole === BOARD_ROLE.OWNER;
  const showViewerBanner = shouldShowViewerBanner(board, user?.id);

  const boardPrefs = prefsQuery.data?.boardPrefs?.[0] || null;
  const surfacePending = isPlannerSurfacePending({
    activeBoardId,
    hasDetailBoard: Boolean(detailBoard),
    hasListBoard: Boolean(listBoard),
  });

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
    showViewerBanner,
    activeId: activeBoardId,
    setActiveId,
    // Soft shell only for a cold empty workspace — never for detail/prefs.
    isLoading: isWorkspaceColdBoot({
      workspaceLoading: workspace.isLoading,
      ready,
      boardCount: boards.length,
    }),
    surfacePending,
    error: workspace.error || detail.error || prefsQuery.error,
    ready,
    bootNote,
    clearBootNote: () => setBootNote(null),
  };
}
