import { useState } from 'react';
import { useBoardLifecycle } from '../hooks/useBoardLifecycle.js';
import { BoardMenu } from './BoardMenu.jsx';
import { BoardTabs } from './BoardTabs.jsx';
import { MenuPopover } from './ui/MenuPopover.jsx';

/**
 * Board tab strip + the active-tab board menu. The menu is anchored to the
 * active tab inside BoardTabs, so it runs as a controlled popover instead of
 * a trigger-based one.
 */
export function BoardNav({ user, boards, board, events, isOwner, onSelect }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const closeMenu = () => setMenuAnchor(null);

  const lifecycle = useBoardLifecycle({
    user,
    boards,
    board,
    events,
    setActiveId: onSelect,
    closeMenu,
    isOwner,
  });

  return (
    <>
      <BoardTabs
        boards={boards}
        activeId={board.id}
        canAdd={isOwner}
        onSelect={onSelect}
        onOpenActive={(e) => setMenuAnchor(e.currentTarget)}
        onAdd={lifecycle.addBoard}
      />
      <MenuPopover
        open={Boolean(menuAnchor)}
        onOpenChange={(open) => {
          if (!open) closeMenu();
        }}
        anchor={menuAnchor}
        align="start"
      >
        <BoardMenu
          board={board}
          solo={boards.length < 2}
          canEditMeta={isOwner}
          onCommit={lifecycle.commitBoard}
          onDup={lifecycle.duplicateBoard}
          onClear={lifecycle.clearBoard}
          onDelete={lifecycle.deleteBoard}
        />
      </MenuPopover>
    </>
  );
}
