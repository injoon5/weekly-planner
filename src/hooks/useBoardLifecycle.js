import { useRef } from 'react';
import { isOk } from '../command-result.js';
import { db } from '../instant.js';
import {
  buildExportPayload,
  buildImportTransactions,
  downloadJson,
  exportFilename,
  parseImportText,
} from '../board-import-export.js';
import { nextBoardName, nextBoardSortOrder } from '../models.js';
import { defaultBoardRange } from '../time.js';
import { commitTransaction } from '../transaction.js';
import {
  boardTx,
  deleteBoardTx,
  deleteEventRowsTx,
  patchBoardTx,
} from '../tx/boards.js';

/** Owner board CRUD. Import/export live in board-import-export.js. */
export function useBoardLifecycle({
  user,
  boards,
  board,
  events,
  setActiveId,
  closeMenu,
  toast,
  isOwner = true,
}) {
  const fileRef = useRef(null);
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

  const doExport = async () => {
    let exportBoards;
    try {
      const result = await db.queryOnce({ boards: { events: {} } });
      exportBoards = [...(result.data?.boards || [])].sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          (a.createdAt ?? 0) - (b.createdAt ?? 0),
      );
    } catch (error) {
      console.error(error);
      toast('내보낼 시간표를 불러오지 못했어요');
      return;
    }
    downloadJson(buildExportPayload(exportBoards), exportFilename());
    closeMenu();
    toast('JSON 파일로 내보냈어요');
  };

  const askImport = () => {
    if (!isOwner) return;
    closeMenu();
    fileRef.current?.click();
  };

  const onImportFile = async (e) => {
    if (!isOwner || !user) return;
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = await parseImportText(text);
      if (parsed.error) {
        toast(parsed.error);
        return;
      }
      const built = buildImportTransactions(parsed.json, {
        userId: user.id,
        existingBoards: boards,
      });
      if (built.error) {
        toast(built.error);
        return;
      }
      if (!isOk(await commit(built.txs, '파일을 가져오지 못했어요'))) return;
      setActiveId(built.firstId);
      toast(
        built.boards.length === 1
          ? `'${built.boards[0].name}' 시간표를 가져왔어요`
          : `시간표 ${built.boards.length}개를 가져왔어요`,
      );
    } catch {
      toast('파일을 가져오지 못했어요');
    }
  };

  return {
    fileRef,
    addBoard,
    commitBoard,
    duplicateBoard,
    clearBoard,
    deleteBoard,
    doExport,
    askImport,
    onImportFile,
  };
}
