import { useEffect, useMemo, useState } from 'react';
import { createTodoTx, db, deleteTodoTx, setTodoDoneTx } from '../db.js';
import { commitTransaction } from '../transaction.js';
import { plannerDate } from '../time.js';

/**
 * Today's to-dos, synced through Instant so they follow the user across
 * devices in realtime. Scoped to the planner day (`day`, 06:00→06:00), so the
 * list is empty each morning and never carries across weeks — it's a fresh
 * checklist for the day, independent of any board.
 *
 * Requires the `todos` namespace + owner link to be pushed to Instant
 * (`npm run push:schema && npm run push:perms`).
 */
export function useTodayTodos(user, onError) {
  const [day, setDay] = useState(plannerDate);

  // Roll to the next planner day at the 06:00 boundary while the app is open.
  useEffect(() => {
    const sync = () => setDay((prev) => (prev === plannerDate() ? prev : plannerDate()));
    const onVisible = () => {
      if (!document.hidden) sync();
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(sync, 30_000);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  const { data } = db.useQuery(
    user?.id
      ? {
          todos: {
            $: {
              where: { 'owner.id': user.id, day },
              order: { sortOrder: 'asc' },
            },
          },
        }
      : null,
  );

  const todos = useMemo(
    () =>
      (data?.todos || []).map((t) => ({
        id: t.id,
        text: t.text || '',
        done: Boolean(t.done),
        sortOrder: t.sortOrder ?? 0,
      })),
    [data],
  );

  const api = useMemo(() => {
    const run = (tx, message) =>
      commitTransaction((transaction) => db.transact(transaction), tx, { message, onError });

    return {
      add(text) {
        const clean = text.trim();
        if (!clean || !user?.id) return;
        const nextOrder = todos.reduce((m, t) => Math.max(m, t.sortOrder), -1) + 1;
        const { tx } = createTodoTx(user.id, { day, text: clean, sortOrder: nextOrder });
        run(tx, '할 일을 추가하지 못했어요');
      },
      toggle(id) {
        const target = todos.find((t) => t.id === id);
        if (!target) return;
        run(setTodoDoneTx(id, !target.done), '할 일을 변경하지 못했어요');
      },
      remove(id) {
        run(deleteTodoTx(id), '할 일을 삭제하지 못했어요');
      },
    };
  }, [day, todos, user?.id, onError]);

  return { todos, date: day, ...api };
}
