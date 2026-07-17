import { db, id } from '../instant.js';

/** Mark a schedule event done for `day` (presence of the row == checked). */
export function checkTodoTx(userId, { day, eventId }) {
  const tid = id();
  return {
    tid,
    tx: db.tx.todos[tid]
      .update({ day, eventId, createdAt: Date.now() })
      .link({ owner: userId }),
  };
}

/** Clear the check mark(s) for an event by deleting their row(s). */
export function uncheckTodoTx(tids) {
  return (Array.isArray(tids) ? tids : [tids]).map((tid) => db.tx.todos[tid].delete());
}
