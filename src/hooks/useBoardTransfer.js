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
import { t } from '../strings.js';

async function doExport() {
  let exportBoards;
  try {
    const result = await db.queryOnce({ boards: { events: {} } });
    exportBoards = sortBoards(result.data?.boards);
  } catch (error) {
    console.error(error);
    toast(t.transfer.exportFailed);
    return;
  }
  downloadJson(buildExportPayload(exportBoards), exportFilename());
  toast(t.transfer.exported);
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
      const result = await commitTx(built.txs, t.transfer.importFailed);
      if (!isOk(result)) return;
      setActiveId(built.firstId);
      toast(
        built.boards.length === 1
          ? t.transfer.importedOne(built.boards[0].name)
          : t.transfer.importedMany(built.boards.length),
      );
    } catch {
      toast(t.transfer.importFailed);
    }
  };

  return { fileRef, doExport, askImport, onImportFile };
}
