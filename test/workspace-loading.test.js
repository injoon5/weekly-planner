import { describe, expect, it } from 'vitest';
import {
  isPlannerSurfacePending,
  isWorkspaceColdBoot,
  shouldFullPageBoot,
} from '../src/board/workspace-loading.js';

describe('workspace loading gates', () => {
  it('cold-boots only while the board list is empty and still loading or not ready', () => {
    expect(
      isWorkspaceColdBoot({ workspaceLoading: true, ready: false, boardCount: 0 }),
    ).toBe(true);
    expect(
      isWorkspaceColdBoot({ workspaceLoading: false, ready: false, boardCount: 0 }),
    ).toBe(true);
    expect(
      isWorkspaceColdBoot({ workspaceLoading: false, ready: true, boardCount: 0 }),
    ).toBe(false);
    // Boards already present — never soft-shell cold boot for detail/prefs refresh.
    expect(
      isWorkspaceColdBoot({ workspaceLoading: true, ready: false, boardCount: 2 }),
    ).toBe(false);
    expect(
      isWorkspaceColdBoot({ workspaceLoading: false, ready: true, boardCount: 1 }),
    ).toBe(false);
  });

  it('shouldFullPageBoot keeps chrome when a list board exists', () => {
    expect(
      shouldFullPageBoot({
        workspaceLoading: false,
        ready: true,
        boardCount: 1,
        hasBoard: true,
      }),
    ).toBe(false);
    expect(
      shouldFullPageBoot({
        workspaceLoading: true,
        ready: false,
        boardCount: 0,
        hasBoard: false,
      }),
    ).toBe(true);
    expect(
      shouldFullPageBoot({
        workspaceLoading: false,
        ready: true,
        boardCount: 1,
        hasBoard: false,
      }),
    ).toBe(true);
  });

  it('surface pending only while detail is missing for the active board', () => {
    expect(
      isPlannerSurfacePending({
        activeBoardId: 'b1',
        hasDetailBoard: false,
      }),
    ).toBe(true);
    expect(
      isPlannerSurfacePending({
        activeBoardId: 'b1',
        hasDetailBoard: true,
      }),
    ).toBe(false);
    expect(
      isPlannerSurfacePending({
        activeBoardId: null,
        hasDetailBoard: false,
      }),
    ).toBe(false);
  });
});
