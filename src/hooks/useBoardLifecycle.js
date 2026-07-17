import { isOk } from '../lib/command-result.js';
import { toast } from '../lib/notify.js';
import { db } from '../db/instant.js';
import { nextBoardName, nextBoardSortOrder } from '../board/models.js';
import { defaultBoardRange } from '../lib/time.js';
import { commitTransaction } from '../db/transaction.js';
import {
  boardTx,
  deleteBoardTx,
  deleteEventRowsTx,
  patchBoardTx,
} from '../db/tx/boards.js';

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
  const commit = async (transaction, message) =>
    await commitTransaction((tx) => db.transact(tx), transaction, {
      message,
      onError: toast,
    });

  const addBoard = async () => {
    if (!isOwner || !user) return;
    const sortOrder = nextBoardSortOrder(boards);
    const range = defaultBoardRange();
    const { bid, txs } = boardTx(
      user.id,
      { name: nextBoardName(boards), from: range.from, to: range.to, events: [] },
      sortOrder,
    );
    if (isOk(await commit(txs, '시간표를 만들지 못했어요'))) setActiveId(bid);
  };

  const commitBoard = async (patch) => {
    if (!isOwner || !board) return;
    const tx = patchBoardTx(board.id, patch);
    if (!tx) return;
    await commit(tx, '시간표 설정을 저장하지 못했어요');
  };

  const duplicateBoard = async () => {
    if (!isOwner || !user || !board) return;
    const sortOrder = nextBoardSortOrder(boards);
    const { bid, txs } = boardTx(
      user.id,
      {
        name: (board.name || '시간표') + ' 사본',
        from: board.from || '',
        to: board.to || '',
        repeatEvery: board.repeatEvery || 0,
        events,
        colorLabels: board.colorLabels || '',
      },
      sortOrder,
    );
    if (isOk(await commit(txs, '시간표를 복제하지 못했어요'))) {
      setActiveId(bid);
      closeMenu();
    }
  };

  const clearBoard = async () => {
    if (!isOwner || !board) return;
    const txs = deleteEventRowsTx(events.map((e) => e.id));
    if (!txs.length || isOk(await commit(txs, '일정을 비우지 못했어요'))) closeMenu();
  };

  const deleteBoard = async () => {
    if (!isOwner || !board || boards.length <= 1) return;
    const i = boards.findIndex((b) => b.id === board.id);
    const next = boards.filter((b) => b.id !== board.id);
    if (isOk(await commit(deleteBoardTx(board.id), '시간표를 삭제하지 못했어요'))) {
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
