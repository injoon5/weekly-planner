import { isOk } from '../lib/command-result.js';
import { nextBoardName, nextBoardSortOrder } from '../board/models.js';
import { defaultBoardRange } from '../lib/time.js';
import { commitTx } from '../db/commit.js';
import {
  boardTx,
  deleteBoardTx,
  deleteEventRowsTx,
  patchBoardTx,
} from '../db/tx/boards.js';
import { t } from '../strings.js';

/** Owner board CRUD. JSON export/import lives in useBoardTransfer.js. */
export function useBoardLifecycle({
  user,
  boards,
  board,
  events,
  setActiveId,
  closeMenu,
  isOwner = true,
}) {
  const addBoard = async () => {
    if (!isOwner || !user) return;
    const sortOrder = nextBoardSortOrder(boards);
    const range = defaultBoardRange();
    const { bid, txs } = boardTx(
      user.id,
      { name: nextBoardName(boards), from: range.from, to: range.to, events: [] },
      sortOrder,
    );
    if (isOk(await commitTx(txs, t.board.toast.addFailed))) setActiveId(bid);
  };

  const commitBoard = async (patch) => {
    if (!isOwner || !board) return;
    const tx = patchBoardTx(board.id, patch);
    if (!tx) return;
    await commitTx(tx, t.board.toast.settingsSaveFailed);
  };

  const duplicateBoard = async () => {
    if (!isOwner || !user || !board) return;
    const sortOrder = nextBoardSortOrder(boards);
    const { bid, txs } = boardTx(
      user.id,
      {
        name: (board.name || t.app.board) + t.board.copySuffix,
        from: board.from || '',
        to: board.to || '',
        repeatEvery: board.repeatEvery || 0,
        events,
        colorLabels: board.colorLabels || '',
      },
      sortOrder,
    );
    if (isOk(await commitTx(txs, t.board.toast.duplicateFailed))) {
      setActiveId(bid);
      closeMenu();
    }
  };

  const clearBoard = async () => {
    if (!isOwner || !board) return;
    const txs = deleteEventRowsTx(events.map((e) => e.id));
    if (!txs.length || isOk(await commitTx(txs, t.board.toast.clearFailed))) closeMenu();
  };

  const deleteBoard = async () => {
    if (!isOwner || !board || boards.length <= 1) return;
    const i = boards.findIndex((b) => b.id === board.id);
    const next = boards.filter((b) => b.id !== board.id);
    if (isOk(await commitTx(deleteBoardTx(board.id), t.board.toast.deleteFailed))) {
      setActiveId(next[Math.max(0, i - 1)]?.id || null);
      closeMenu();
    }
  };

  return {
    addBoard,
    commitBoard,
    duplicateBoard,
    clearBoard,
    deleteBoard,
  };
}
