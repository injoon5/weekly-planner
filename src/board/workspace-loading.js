/**
 * Pure loading-gate helpers for the signed-in planner shell.
 * Keep chrome mounted once a board list exists; cold empty workspace uses a
 * soft shell (header + surface pending), not a full-viewport takeover.
 */

/**
 * True when there is nothing to paint yet — empty workspace still loading
 * or bootstrap has not produced boards.
 *
 * @param {{
 *   workspaceLoading?: boolean,
 *   ready?: boolean,
 *   boardCount?: number,
 * }} args
 */
export function isWorkspaceColdBoot({
  workspaceLoading = false,
  ready = false,
  boardCount = 0,
} = {}) {
  if (boardCount > 0) return false;
  return workspaceLoading || !ready;
}

/**
 * Surface-only pending: list board can drive an empty grid while detail hydrates.
 * Prefs must never gate this — and board switches must not wipe into a spinner
 * when a list row already exists.
 *
 * @param {{
 *   activeBoardId?: string | null,
 *   hasDetailBoard?: boolean,
 *   hasListBoard?: boolean,
 * }} args
 */
export function isPlannerSurfacePending({
  activeBoardId = null,
  hasDetailBoard = false,
  hasListBoard = false,
} = {}) {
  if (!activeBoardId) return false;
  // List row is enough to keep the surface mounted (empty grid / swap).
  if (hasListBoard) return false;
  return !hasDetailBoard;
}
