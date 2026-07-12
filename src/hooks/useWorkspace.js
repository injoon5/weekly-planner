import { useEffect, useState } from 'react';
import { db, ensureWorkspace } from '../db.js';
import { fromInstantEvents } from '../models.js';

/**
 * Instant query + active board + one-shot workspace bootstrap.
 * Theme for settings seed is read from localStorage inside ensureWorkspace.
 * Module-level dedupe lives in ensureWorkspace.
 */
export function useWorkspace() {
  const user = db.useUser();
  const { isLoading, error, data } = db.useQuery({
    boards: { events: {} },
    settings: {},
  });

  const boards = [...(data?.boards || [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0),
  );
  const settings = data?.settings?.[0] || null;

  const [activeId, setActiveId] = useState(null);
  const [ready, setReady] = useState(false);
  const [bootNote, setBootNote] = useState(null);

  const board = boards.find((b) => b.id === activeId) || boards[0] || null;
  const events = fromInstantEvents(board?.events);

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
        const result = await ensureWorkspace(user, {
          boardCount: boards.length,
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

  useEffect(() => {
    const el = document.querySelector('[data-active-tab="true"]');
    if (el?.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  return {
    user,
    boards,
    board,
    events,
    settings,
    activeId,
    setActiveId,
    isLoading,
    error,
    ready,
    bootNote,
    clearBootNote: () => setBootNote(null),
  };
}
