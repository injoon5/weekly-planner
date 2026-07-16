import { useEffect, useMemo, useState } from 'react';
import { checkTodoTx, db, uncheckTodoTx } from '../db.js';
import { commitTransaction } from '../transaction.js';
import { fmt, plannerDate } from '../time.js';

/**
 * Today's to-do list = the active board's events scheduled for today, in start
 * order. Ticking one off is personal and ephemeral: the checked state is stored
 * per (`day`, `eventId`) in Instant so it follows the user across devices in
 * realtime, but because `day` is a concrete planner date (06:00→06:00) the same
 * weekly event shows up unchecked again next week. Nothing here mutates the
 * schedule itself.
 *
 * Requires the `todos` namespace + owner link to be pushed to Instant
 * (`npm run push:schema && npm run push:perms`).
 */
export function useTodayTodos(user, events, onError) {
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

  // Today's weekday (0=Sun) in the planner's 06:00→06:00 convention — derived
  // from `day` so it can never drift from the check-state key.
  const weekday = useMemo(() => {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }, [day]);

  const { data } = db.useQuery(
    user?.id ? { todos: { $: { where: { 'owner.id': user.id, day } } } } : null,
  );

  // eventId → array of row ids marking it done today (usually one).
  const checkedBy = useMemo(() => {
    const map = new Map();
    for (const t of data?.todos || []) {
      if (!t.eventId) continue;
      map.set(t.eventId, [...(map.get(t.eventId) || []), t.id]);
    }
    return map;
  }, [data]);

  const todos = useMemo(
    () =>
      (events || [])
        .filter((e) => e.day === weekday)
        .sort((a, b) => a.start - b.start || a.dur - b.dur)
        .map((e) => ({
          id: e.id,
          text: e.title || '',
          time: fmt(e.start),
          done: checkedBy.has(e.id),
        })),
    [events, weekday, checkedBy],
  );

  const api = useMemo(() => {
    const run = (tx, message) =>
      commitTransaction((transaction) => db.transact(transaction), tx, { message, onError });

    return {
      toggle(id) {
        if (!user?.id) return;
        const rows = checkedBy.get(id);
        if (rows?.length) {
          run(uncheckTodoTx(rows), '할 일을 변경하지 못했어요');
        } else {
          run(checkTodoTx(user.id, { day, eventId: id }).tx, '할 일을 변경하지 못했어요');
        }
      },
    };
  }, [day, checkedBy, user?.id, onError]);

  return { todos, date: day, ...api };
}
