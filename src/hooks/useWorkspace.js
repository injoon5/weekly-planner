import { useEffect, useMemo, useState } from 'react';
import { db, ensureWorkspace } from '../db.js';
import { boardCoversDate, fromInstantEvents } from '../models.js';
import { isoDate } from '../time.js';

function ownerIdOf(board) {
  if (!board?.owner) return null;
  return typeof board.owner === 'object' ? board.owner.id : board.owner;
}

function editorIdsOf(board) {
  return (board?.editors || []).map((e) => (typeof e === 'object' ? e.id : e)).filter(Boolean);
}

/** Write truth = boards.editors link (members.role is display cache). */
function roleForBoard(board, userId) {
  if (!board || !userId) return 'viewer';
  if (ownerIdOf(board) === userId) return 'owner';
  if (editorIdsOf(board).includes(userId)) return 'editor';
  return 'viewer';
}

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
  const events = useMemo(() => fromInstantEvents(board?.events), [board?.events]);
  const myRole = useMemo(() => roleForBoard(board, user?.id), [board, user?.id]);
  const canEdit = myRole === 'owner' || myRole === 'editor';
  const isOwner = myRole === 'owner';

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

export { ownerIdOf, roleForBoard };
