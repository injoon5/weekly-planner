import { useRef } from 'react';
import { isOk } from '../lib/command-result.js';
import { toast } from '../lib/notify.js';
import { db } from '../db/instant.js';
import {
  buildExportPayload,
  buildImportTransactions,
  downloadJson,
  exportFilename,
  parseImportText,
} from '../board/board-import-export.js';
import { commitTx } from '../db/commit.js';
import { sortBoards } from '../board/models.js';

async function doExport() {
  let exportBoards;
  try {
    const result = await db.queryOnce({ boards: { events: {} } });
    exportBoards = sortBoards(result.data?.boards);
  } catch (error) {
    console.error(error);
    toast('내보낼 시간표를 불러오지 못했어요');
    return;
  }
  downloadJson(buildExportPayload(exportBoards), exportFilename());
  toast('JSON 파일로 내보냈어요');
}

/**
 * Workspace JSON export/import (the ⋯ menu actions). `fileRef` points at a
 * hidden file input the shell renders; `askImport` clicks it, `onImportFile`
 * ingests the picked file. Payload logic lives in board-import-export.js.
 */
export function useBoardTransfer({ user, boards, setActiveId, isOwner = true }) {
  const fileRef = useRef(null);

  const askImport = () => {
    if (!isOwner) return;
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
      const result = await commitTx(built.txs, '파일을 가져오지 못했어요');
      if (!isOk(result)) return;
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

  return { fileRef, doExport, askImport, onImportFile };
}
