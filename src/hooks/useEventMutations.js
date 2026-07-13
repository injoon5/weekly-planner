import { db, createEventTx, deleteEventTx, patchEventTx, saveEventTx } from '../db.js';
import { commitTransaction } from '../transaction.js';

/** Event CRUD only — shared by workspace + share shells. */
export function useEventMutations({ board, canEdit = true, ruleParams = null, onError }) {
  const transact = async (tx, message) => {
    return await commitTransaction((transaction) => db.transact(transaction), tx, {
      message,
      onError,
    });
  };

  const updateEvent = async (eid, patch) => {
    if (!canEdit) return false;
    const tx = patchEventTx(eid, patch, ruleParams);
    if (!tx) return true;
    return await transact(tx, '일정을 옮기지 못했어요');
  };

  const removeEvent = async (eid) => {
    if (!canEdit) return false;
    return await transact(deleteEventTx(eid, ruleParams), '일정을 삭제하지 못했어요');
  };

  const createEvent = async (fields) => {
    if (!canEdit || !board) return null;
    const { eid, tx } = createEventTx(board.id, fields, ruleParams);
    const didCreate = await transact(tx, '일정을 추가하지 못했어요');
    return didCreate ? eid : null;
  };

  const saveEvent = async (eid, fields) => {
    if (!canEdit) return false;
    return await transact(saveEventTx(eid, fields, ruleParams), '일정을 저장하지 못했어요');
  };

  return { updateEvent, removeEvent, createEvent, saveEvent };
}
