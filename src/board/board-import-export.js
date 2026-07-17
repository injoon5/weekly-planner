import { normBoards } from './legacy.js';
import { nextBoardSortOrder } from './models.js';
import { defaultBoardRange, pad } from '../lib/time.js';
import { boardTx } from '../db/tx/boards.js';

/** Build the JSON export payload from Instant board rows. */
export function buildExportPayload(exportBoards) {
  return {
    app: 'weekly-planner',
    version: 2,
    exportedAt: new Date().toISOString(),
    boards: (exportBoards || []).map((b) => ({
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
}

export function exportFilename(date = new Date()) {
  return `주간계획표-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

/** Trigger a browser JSON download. */
export function downloadJson(payload, filename = exportFilename()) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Parse an import file into normalized boards + Instant txs.
 * @returns {{ boards: unknown[], txs: unknown[], firstId: string | null } | { error: string }}
 */
export function buildImportTransactions(json, { userId, existingBoards }) {
  const importedBoards = normBoards(json);
  if (!importedBoards?.length) return { error: '가져올 시간표가 없어요' };

  const base = nextBoardSortOrder(existingBoards);
  const range = defaultBoardRange();
  const txs = [];
  let firstId = null;
  importedBoards.forEach((importedBoard, index) => {
    const { bid, txs: boardTransactions } = boardTx(
      userId,
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
  return { boards: importedBoards, txs, firstId };
}

export async function parseImportText(text) {
  try {
    return { json: JSON.parse(text) };
  } catch {
    return { error: 'JSON 파일을 읽을 수 없어요' };
  }
}
