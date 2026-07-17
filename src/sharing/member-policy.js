import { BOARD_ROLE, isEditorRole, normalizeMemberRole } from './roles.js';
import { linkedId, linkedIds } from '../lib/links.js';

/**
 * Member role txs against any Instant `tx` namespace (client or admin).
 * Write authority = boards.editors link; members.role is display cache.
 *
 * @param {any} tx Instant transaction namespace (`db.tx`)
 * @param {{ boardId: string, memberId: string, userId: string, role: unknown }} args
 */
export function memberRoleTxs(tx, { boardId, memberId, userId, role }) {
  const normalizedRole = normalizeMemberRole(role);
  return [
    tx.members[memberId].update({ role: normalizedRole }),
    isEditorRole(normalizedRole)
      ? tx.boards[boardId].link({ editors: userId })
      : tx.boards[boardId].unlink({ editors: userId }),
  ];
}

/**
 * Create a member row (+ optional editor link).
 * Caller supplies `memberId` so client and admin Instant packages stay decoupled.
 *
 * @param {any} tx
 * @param {{ boardId: string, userId: string, role: unknown, email?: string, memberId: string, now?: number }} args
 */
export function createMemberTxs(
  tx,
  { boardId, userId, role, email = '', memberId, now = Date.now() },
) {
  const normalizedRole = normalizeMemberRole(role);
  const txs = [
    tx.members[memberId]
      .update({ role: normalizedRole, email: email || '', createdAt: now })
      .link({ board: boardId, user: userId }),
  ];
  if (isEditorRole(normalizedRole)) {
    txs.push(tx.boards[boardId].link({ editors: userId }));
  }
  return { mid: memberId, txs };
}

/**
 * Remove member + clear editor link.
 * @param {any} tx
 * @param {{ boardId: string, memberId: string, userId?: string | null }} args
 */
export function removeMemberTxs(tx, { boardId, memberId, userId }) {
  const txs = [tx.members[memberId].delete()];
  if (userId) txs.push(tx.boards[boardId].unlink({ editors: userId }));
  return txs;
}

/** Find a membership row for a user id on a board query result. */
export function findMemberForUser(members, userId) {
  if (!userId) return null;
  return (members || []).find((m) => linkedId(m.user) === userId) || null;
}

/** Owner id of a board row (link may arrive as a row object or bare id). */
export function ownerIdOf(board) {
  return linkedId(board?.owner);
}

/**
 * Effective role of a user on a board.
 * Write truth = boards.editors link (members.role is display cache).
 */
export function roleForBoard(board, userId) {
  if (!board || !userId) return BOARD_ROLE.VIEWER;
  if (ownerIdOf(board) === userId) return BOARD_ROLE.OWNER;
  if (linkedIds(board?.editors).includes(userId)) return BOARD_ROLE.EDITOR;
  return BOARD_ROLE.VIEWER;
}
