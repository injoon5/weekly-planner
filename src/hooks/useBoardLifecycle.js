import { useRef } from 'react';
import {
  db,
  boardTx,
  patchBoardTx,
} from '../db.js';
import { normBoards } from '../legacy.js';
import { nextBoardSortOrder, nextBoardName } from '../models.js';
import { defaultBoardRange, pad } from '../time.js';

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

  const addBoard = () => {
    if (!isOwner || !user) return;
    const sortOrder = nextBoardSortOrder(boards);
    const range = defaultBoardRange();
    const { bid, txs } = boardTx(
      user.id,
      { name: nextBoardName(boards), from: range.from, to: range.to, events: [] },
      sortOrder,
    );
    db.transact(txs);
    setActiveId(bid);
  };

  const commitBoard = (patch) => {
    if (!isOwner || !board) return;
    const tx = patchBoardTx(board.id, patch);
    if (tx) db.transact(tx);
  };

  const duplicateBoard = () => {
    if (!isOwner || !user || !board) return;
    const sortOrder = nextBoardSortOrder(boards);
    const { bid, txs } = boardTx(
      user.id,
      {
        name: (board.name || '시간표') + ' 사본',
        from: board.from || '',
        to: board.to || '',
        events,
        colorLabels: board.colorLabels || '',
      },
      sortOrder,
    );
    db.transact(txs);
    setActiveId(bid);
    closeMenu();
  };

  const clearBoard = () => {
    if (!isOwner || !board) return;
    const txs = events.map((e) => db.tx.events[e.id].delete());
    if (txs.length) db.transact(txs);
    closeMenu();
  };

  const deleteBoard = () => {
    if (!isOwner || !board || boards.length <= 1) return;
    const i = boards.findIndex((b) => b.id === board.id);
    const next = boards.filter((b) => b.id !== board.id);
    db.transact(db.tx.boards[board.id].delete());
    setActiveId(next[Math.max(0, i - 1)]?.id || null);
    closeMenu();
  };

  const doExport = () => {
    const payload = {
      app: 'weekly-planner',
      version: 2,
      exportedAt: new Date().toISOString(),
      boards: boards.map((b) => ({
        name: b.name,
        from: b.from || '',
        to: b.to || '',
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

  const onImportFile = (e) => {
    if (!isOwner || !user) return;
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    f.text()
      .then((t) => {
        let j;
        try {
          j = JSON.parse(t);
        } catch {
          toast('JSON 파일을 읽을 수 없어요');
          return;
        }
        const bs = normBoards(j);
        if (!bs?.length) {
          toast('가져올 시간표가 없어요');
          return;
        }
        const base = nextBoardSortOrder(boards);
        const range = defaultBoardRange();
        const txs = [];
        let firstId = null;
        bs.forEach((b, i) => {
          const { bid, txs: bt } = boardTx(
            user.id,
            {
              ...b,
              from: b.from || range.from,
              to: b.to || range.to,
            },
            base + i,
          );
          if (!firstId) firstId = bid;
          txs.push(...bt);
        });
        db.transact(txs);
        setActiveId(firstId);
        toast(
          bs.length === 1
            ? `'${bs[0].name}' 시간표를 가져왔어요`
            : `시간표 ${bs.length}개를 가져왔어요`,
        );
      })
      .catch(() => toast('파일을 읽는 중 문제가 생겼어요'));
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
