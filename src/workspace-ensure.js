import { THEME_KEY } from './config.js';
import { db, id } from './instant.js';
import { readLegacyBoards, seedEvents } from './legacy.js';
import { defaultBoardRange } from './time.js';
import { boardTx } from './tx/boards.js';
import { workspaceBootstrapPlan } from './workspace-bootstrap.js';

const inflight = new Map();

/**
 * Workspace setup deduped only while a transaction is in flight. Durable query
 * state decides whether settings or a first board are still needed.
 */
export async function ensureWorkspace(user, { accessibleBoardCount, hasSettings }) {
  if (!user?.id) return { seeded: false, migrated: false };
  if (inflight.has(user.id)) return inflight.get(user.id);

  const run = (async () => {
    const { shouldSeedBoard, shouldCreateSettings } = workspaceBootstrapPlan({
      accessibleBoardCount,
      hasSettings,
    });
    if (!shouldSeedBoard && !shouldCreateSettings) return { seeded: false, migrated: false };

    const txs = [];
    let migrated = false;
    const range = defaultBoardRange();

    if (shouldSeedBoard) {
      const legacy = readLegacyBoards();
      const source = legacy?.length
        ? legacy.map((b) => ({
            ...b,
            from: b.from || range.from,
            to: b.to || range.to,
          }))
        : [{ name: '내 시간표', from: range.from, to: range.to, events: seedEvents() }];
      migrated = Boolean(legacy?.length);
      source.forEach((b, i) => {
        const { txs: bt } = boardTx(user.id, b, i);
        txs.push(...bt);
      });
    }

    if (shouldCreateSettings) {
      const themeVal = localStorage.getItem(THEME_KEY) || 'light';
      txs.push(db.tx.settings[id()].update({ theme: themeVal }).link({ owner: user.id }));
    }

    if (txs.length) await db.transact(txs);
    return { seeded: shouldSeedBoard, migrated };
  })();

  inflight.set(user.id, run);
  try {
    return await run;
  } finally {
    inflight.delete(user.id);
  }
}
