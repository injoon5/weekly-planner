import { db, createEventTx, deleteEventTx, patchEventTx } from '../db.js';

/** Event CRUD only — shared by workspace + share shells. */
export function useEventMutations({ board, canEdit = true, ruleParams = null }) {
  const updateEvent = (eid, patch) => {
    if (!canEdit) return;
    const tx = patchEventTx(eid, patch, ruleParams);
    if (tx) db.transact(tx);
  };

  const removeEvent = (eid) => {
    if (!canEdit) return;
    db.transact(deleteEventTx(eid, ruleParams));
  };

  const createEvent = (fields) => {
    if (!canEdit || !board) return null;
    const { eid, tx } = createEventTx(board.id, fields, ruleParams);
    db.transact(tx);
    return eid;
  };

  return { updateEvent, removeEvent, createEvent };
}
