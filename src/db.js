/**
 * Thin Instant client re-export. Prefer `instant.js` + `tx/*` for new code.
 * Domain policy lives in share-policy / member-policy / workspace-ensure.
 */
export { db, id } from './instant.js';
export {
  boardTx,
  patchBoardTx,
  deleteBoardTx,
  deleteEventRowsTx,
} from './tx/boards.js';
export {
  createEventTx,
  patchEventTx,
  saveEventTx,
  deleteEventTx,
} from './tx/events.js';
export {
  createShareTx,
  patchShareTx,
  deleteShareTx,
  replaceShareTxs,
} from './tx/shares.js';
export {
  createMemberTx,
  setMemberEditorTx,
  patchMemberTx,
  setMemberRoleTxs,
  deleteMemberTx,
  removeMemberWithEditorTxs,
} from './tx/members.js';
export { upsertBoardPrefsTx } from './tx/prefs.js';
export { checkTodoTx, uncheckTodoTx } from './tx/todos.js';
export { persistThemeTx } from './tx/theme.js';
export { buildShareSecrets } from './share-policy.js';
export { ensureWorkspace } from './workspace-ensure.js';
