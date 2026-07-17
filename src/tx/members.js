import { db, id } from '../instant.js';
import {
  createMemberTxs as createMemberTxsPolicy,
  memberRoleTxs as memberRoleTxsPolicy,
  removeMemberTxs as removeMemberTxsPolicy,
} from '../member-policy.js';
import { normalizeMemberRole } from '../roles.js';

export function createMemberTx(boardId, userId, role, email = '') {
  return createMemberTxsPolicy(db.tx, {
    boardId,
    userId,
    role,
    email,
    memberId: id(),
  });
}

export function setMemberEditorTx(boardId, userId, isEditor) {
  return isEditor
    ? db.tx.boards[boardId].link({ editors: userId })
    : db.tx.boards[boardId].unlink({ editors: userId });
}

export function patchMemberTx(memberId, patch) {
  const clean = {};
  if (patch.role !== undefined) clean.role = normalizeMemberRole(patch.role);
  if (patch.email !== undefined) clean.email = patch.email;
  if (!Object.keys(clean).length) return null;
  return db.tx.members[memberId].update(clean);
}

export function setMemberRoleTxs(boardId, memberId, userId, role) {
  return memberRoleTxsPolicy(db.tx, { boardId, memberId, userId, role });
}

export function deleteMemberTx(memberId) {
  return db.tx.members[memberId].delete();
}

export function removeMemberWithEditorTxs(boardId, memberId, userId) {
  return removeMemberTxsPolicy(db.tx, { boardId, memberId, userId });
}
