import { db, id, withRuleParams } from '../instant.js';
import { eventFields } from '../../board/models.js';

export function createEventTx(boardId, fields, ruleParams) {
  const eid = id();
  return {
    eid,
    tx: withRuleParams(
      db.tx.events[eid]
        .update({ ...eventFields(fields), createdAt: Date.now() })
        .link({ board: boardId }),
      ruleParams,
    ),
  };
}

export function patchEventTx(eid, patch, ruleParams) {
  const clean = {};
  for (const k of ['day', 'title', 'start', 'dur', 'color', 'memo']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (!Object.keys(clean).length) return null;
  return withRuleParams(db.tx.events[eid].update(clean), ruleParams);
}

export function saveEventTx(eid, fields, ruleParams) {
  return withRuleParams(db.tx.events[eid].update(eventFields(fields)), ruleParams);
}

export function deleteEventTx(eid, ruleParams) {
  return withRuleParams(db.tx.events[eid].delete(), ruleParams);
}
