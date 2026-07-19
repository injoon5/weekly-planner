import { isOk } from '../lib/command-result.js';
import {
  createEventTx,
  deleteEventTx,
  patchEventTx,
  saveEventTx,
} from '../db/tx/events.js';
import { commitTx } from '../db/commit.js';
import { t } from '../strings.js';

/** Event CRUD only — shared by workspace + share shells. */
export function useEventMutations({ board, canEdit = true, ruleParams = null }) {
  const updateEvent = async (eid, patch) => {
    if (!canEdit) return false;
    const tx = patchEventTx(eid, patch, ruleParams);
    if (!tx) return true;
    return isOk(await commitTx(tx, t.event.toast.moveFailed));
  };

  const removeEvent = async (eid) => {
    if (!canEdit) return false;
    return isOk(await commitTx(deleteEventTx(eid, ruleParams), t.event.toast.deleteFailed));
  };

  const createEvent = async (fields) => {
    if (!canEdit || !board) return null;
    const { eid, tx } = createEventTx(board.id, fields, ruleParams);
    const result = await commitTx(tx, t.event.toast.addFailed);
    return isOk(result) ? eid : null;
  };

  const saveEvent = async (eid, fields) => {
    if (!canEdit) return false;
    return isOk(await commitTx(saveEventTx(eid, fields, ruleParams), t.event.toast.saveFailed));
  };

  return { updateEvent, removeEvent, createEvent, saveEvent };
}
