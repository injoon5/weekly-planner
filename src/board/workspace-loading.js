/**
 * Pure loading-gate helpers for the signed-in planner shell.
 * Keep chrome mounted once a board list exists; only cold-boot full-page.
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
 * True when the planner should replace the whole tree with a boot screen.
 * Once boards exist, detail/prefs refresh must not tear down chrome.
 *
 * @param {{
 *   workspaceLoading?: boolean,
 *   ready?: boolean,
 *   boardCount?: number,
 *   hasBoard?: boolean,
 * }} args
 */
export function shouldFullPageBoot({
  workspaceLoading = false,
  ready = false,
  boardCount = 0,
  hasBoard = false,
} = {}) {
  if (isWorkspaceColdBoot({ workspaceLoading, ready, boardCount })) return true;
  // Boards listed but no row to drive the shell yet (brief selection gap).
  return boardCount === 0 || !hasBoard;
}

/**
 * Surface-only pending: list board can drive the header while detail hydrates.
 * Prefs must never gate this — only missing detail for the active board.
 *
 * @param {{
 *   activeBoardId?: string | null,
 *   hasDetailBoard?: boolean,
 * }} args
 */
export function isPlannerSurfacePending({
  activeBoardId = null,
  hasDetailBoard = false,
} = {}) {
  return Boolean(activeBoardId && !hasDetailBoard);
}
