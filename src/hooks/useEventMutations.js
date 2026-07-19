import { isOk } from '../lib/command-result.js';
import {
  createEventTx,
  deleteEventTx,
  patchEventTx,
  saveEventTx,
} from '../db/tx/events.js';
import { commitTx } from '../db/commit.js';

/** Event CRUD only — shared by workspace + share shells. */
export function useEventMutations({ board, canEdit = true, ruleParams = null }) {
  const updateEvent = async (eid, patch) => {
    if (!canEdit) return false;
    const tx = patchEventTx(eid, patch, ruleParams);
    if (!tx) return true;
    return isOk(await commitTx(tx, '일정을 옮기지 못했어요'));
  };

  const removeEvent = async (eid) => {
    if (!canEdit) return false;
    return isOk(await commitTx(deleteEventTx(eid, ruleParams), '일정을 삭제하지 못했어요'));
  };

  const createEvent = async (fields) => {
    if (!canEdit || !board) return null;
    const { eid, tx } = createEventTx(board.id, fields, ruleParams);
    const result = await commitTx(tx, '일정을 추가하지 못했어요');
    return isOk(result) ? eid : null;
  };

  const saveEvent = async (eid, fields) => {
    if (!canEdit) return false;
    return isOk(await commitTx(saveEventTx(eid, fields, ruleParams), '일정을 저장하지 못했어요'));
  };

  return { updateEvent, removeEvent, createEvent, saveEvent };
}
