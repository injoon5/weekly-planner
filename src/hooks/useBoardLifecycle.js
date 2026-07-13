import { useRef } from 'react';
import {
  db,
  boardTx,
  patchBoardTx,
} from '../db.js';
import { normBoards } from '../legacy.js';
import { nextBoardSortOrder, nextBoardName } from '../models.js';
import { defaultBoardRange, pad } from '../time.js';
import { commitTransaction } from '../transaction.js';

/** Owner board CRUD + import/export. */
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
    if (await commit(txs, '시간표를 만들지 못했어요')) setActiveId(bid);
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
    if (await commit(txs, '시간표를 복제하지 못했어요')) {
      setActiveId(bid);
      closeMenu();
    }
  };

  const clearBoard = async () => {
    if (!isOwner || !board) return;
    const txs = events.map((e) => db.tx.events[e.id].delete());
    if (!txs.length || (await commit(txs, '일정을 비우지 못했어요'))) closeMenu();
  };

  const deleteBoard = async () => {
    if (!isOwner || !board || boards.length <= 1) return;
    const i = boards.findIndex((b) => b.id === board.id);
    const next = boards.filter((b) => b.id !== board.id);
    if (await commit(db.tx.boards[board.id].delete(), '시간표를 삭제하지 못했어요')) {
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
    const payload = {
      app: 'weekly-planner',
      version: 2,
      exportedAt: new Date().toISOString(),
      boards: exportBoards.map((b) => ({
        name: b.name,
        from: b.from || '',
        to: b.to || '',
        repeatEvery: b.repeatEvery || 0,
        events: (b.events || []).map(({ day, title, start, dur, color, memo }) => ({
          day,
          title,
          start,
          dur,
          color,
          memo: memo || '',
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `주간계획표-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        toast('JSON 파일을 읽을 수 없어요');
        return;
      }
      const importedBoards = normBoards(json);
      if (!importedBoards?.length) {
        toast('가져올 시간표가 없어요');
        return;
      }
      const base = nextBoardSortOrder(boards);
      const range = defaultBoardRange();
      const txs = [];
      let firstId = null;
      importedBoards.forEach((importedBoard, index) => {
        const { bid, txs: boardTransactions } = boardTx(
          user.id,
          {
            ...importedBoard,
            from: importedBoard.from || range.from,
            to: importedBoard.to || range.to,
          },
          base + index,
        );
        if (!firstId) firstId = bid;
        txs.push(...boardTransactions);
      });
      if (!(await commit(txs, '파일을 가져오지 못했어요'))) return;
      setActiveId(firstId);
      toast(
        importedBoards.length === 1
          ? `'${importedBoards[0].name}' 시간표를 가져왔어요`
          : `시간표 ${importedBoards.length}개를 가져왔어요`,
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
