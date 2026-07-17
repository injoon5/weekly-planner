import { useEffect } from 'react';
import { useBoardSwap } from '../hooks/useBoardSwap.js';
import { useBoardTransfer } from '../hooks/useBoardTransfer.js';
import { usePlannerRuntime } from '../hooks/usePlannerRuntime.js';
import { useTheme } from '../hooks/useTheme.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { toast } from '../lib/notify.js';
import { PlannerContext } from './planner-context.js';

/**
 * Signed-in planner shell state: workspace query, runtime (events/views/presence),
 * theme, and JSON transfer. Children read via `usePlannerContext()`.
 */
export function PlannerProvider({ children }) {
  const workspace = useWorkspace();
  const { theme, toggleTheme } = useTheme(workspace.settings);
  const runtime = usePlannerRuntime({
    board: workspace.board,
    events: workspace.events,
    boardPrefs: workspace.boardPrefs,
    user: workspace.user,
    settings: workspace.settings,
    canRenameColors: workspace.isOwner,
    role: workspace.myRole,
    canEdit: workspace.canEdit,
  });
  const transfer = useBoardTransfer({
    user: workspace.user,
    boards: workspace.boards,
    setActiveId: workspace.setActiveId,
    isOwner: workspace.isOwner,
  });
  const swapping = useBoardSwap(workspace.board?.id);

  useEffect(() => {
    if (!workspace.bootNote) return;
    toast(workspace.bootNote);
    workspace.clearBootNote();
    // One-shot boot toast — clearBootNote identity is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.bootNote]);

  const value = {
    ...workspace,
    theme,
    toggleTheme,
    runtime,
    transfer,
    swapping,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}
