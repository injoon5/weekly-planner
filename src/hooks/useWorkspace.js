import { useEffect, useMemo, useState } from 'react';
import { db, ensureWorkspace } from '../db.js';
import { fromInstantEvents } from '../models.js';

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
  const { isLoading, error, data } = db.useQuery({
    boards: {
      owner: {},
      events: {},
      members: { user: {} },
      editors: {},
      shares: {},
    },
    settings: {},
    boardPrefs: { board: {}, user: {} },
  });

  const boards = [...(data?.boards || [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0),
  );
  const settings = data?.settings?.[0] || null;
  const allPrefs = data?.boardPrefs || [];

  const [activeId, setActiveId] = useState(null);
  const [ready, setReady] = useState(false);
  const [bootNote, setBootNote] = useState(null);

  const board = boards.find((b) => b.id === activeId) || boards[0] || null;
  const events = fromInstantEvents(board?.events);
  const myRole = useMemo(() => roleForBoard(board, user?.id), [board, user?.id]);
  const canEdit = myRole === 'owner' || myRole === 'editor';
  const isOwner = myRole === 'owner';

  const boardPrefs = useMemo(() => {
    if (!board || !user) return null;
    return (
      allPrefs.find((p) => {
        const bid = p.board?.id || p.board;
        const uid = p.user?.id || p.user;
        return bid === board.id && uid === user.id;
      }) || null
    );
  }, [allPrefs, board, user]);

  useEffect(() => {
    if (!boards.length) {
      setActiveId(null);
      return;
    }
    if (!boards.some((b) => b.id === activeId)) setActiveId(boards[0].id);
  }, [boards, activeId]);

  useEffect(() => {
    if (isLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const ownedCount = boards.filter((b) => ownerIdOf(b) === user.id).length;
        const result = await ensureWorkspace(user, {
          boardCount: ownedCount,
          hasSettings: Boolean(settings),
        });
        if (cancelled) return;
        if (result.firstId) setActiveId(result.firstId);
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
  }, [isLoading, user?.id, boards.length, settings?.id]);

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
    isLoading,
    error,
    ready,
    bootNote,
    clearBootNote: () => setBootNote(null),
  };
}

export { ownerIdOf, roleForBoard };
