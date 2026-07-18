import { ACCESS_ROLE, BOARD_ROLE, isEditorRole, normalizeMemberRole } from './roles.js';
import { linkedId, linkedIds } from '../lib/links.js';

/**
 * Member role txs against any Instant `tx` namespace (client or admin).
 *
 * Write authority = `boards.editors` link (Instant perms can check links, not
 * correlated `members.role` fields). `members.role` is written in the same
 * transaction as a display mirror for SharePanel — never consulted for auth.
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
 * Display role for a membership row. Prefers `boards.editors` when hydrated;
 * falls back to the mirrored `members.role` field.
 *
 * @param {{ editors?: unknown } | null | undefined} board
 * @param {{ user?: unknown, role?: unknown }} member
 * @returns {'viewer' | 'editor'}
 */
export function displayRoleForMember(board, member) {
  const userId = linkedId(member?.user);
  if (userId && Array.isArray(board?.editors)) {
    return linkedIds(board.editors).includes(userId)
      ? ACCESS_ROLE.EDITOR
      : ACCESS_ROLE.VIEWER;
  }
  return normalizeMemberRole(member?.role);
}

/**
 * Effective role of a user on a board.
 * Write truth = boards.editors link. Defaults to viewer when links are missing —
 * pair with `roleKnown` before showing viewer-only UI.
 */
export function roleForBoard(board, userId) {
  if (!board || !userId) return BOARD_ROLE.VIEWER;
  if (ownerIdOf(board) === userId) return BOARD_ROLE.OWNER;
  if (linkedIds(board?.editors).includes(userId)) return BOARD_ROLE.EDITOR;
  return BOARD_ROLE.VIEWER;
}

/**
 * Whether board relation links are hydrated enough to trust `roleForBoard`.
 * List queries should include `editors: {}` so this resolves without waiting
 * on the detail query.
 *
 * @param {{
 *   owner?: unknown,
 *   editors?: unknown,
 *   members?: unknown[],
 * } | null | undefined} board
 * @param {string | null | undefined} userId
 */
export function roleKnown(board, userId) {
  if (!board || !userId) return false;
  if (ownerIdOf(board) === userId) return true;
  if (Array.isArray(board.editors)) return true;
  if (Array.isArray(board.members) && findMemberForUser(board.members, userId)) {
    return true;
  }
  return false;
}

/**
 * Viewer-only chrome (e.g. 보기 전용 banner) — only when role is resolved.
 * @param {{
 *   owner?: unknown,
 *   editors?: unknown,
 *   members?: unknown[],
 * } | null | undefined} board
 * @param {string | null | undefined} userId
 */
export function shouldShowViewerBanner(board, userId) {
  return roleKnown(board, userId) && roleForBoard(board, userId) === BOARD_ROLE.VIEWER;
}
