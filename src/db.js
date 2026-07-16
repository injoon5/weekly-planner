import { init, id } from '@instantdb/react';
import { APP_ID, THEME_KEY } from './config.js';
import { readLegacyBoards, seedEvents } from './legacy.js';
import { isEditorRole, normalizeMemberRole } from './member-role.js';
import { eventFields } from './models.js';
import schema from './schema.js';
import { defaultBoardRange } from './time.js';
import { serializeColorLabels } from './prefs.js';
import { hashSharePassword, randomToken } from './share.js';
import { workspaceBootstrapPlan } from './workspace-bootstrap.js';

// Instant persists recent query subscriptions to IndexedDB and syncs when
// back online — no extra offline wiring needed for app data.
export const db = init({ appId: APP_ID, schema });

function withRuleParams(tx, ruleParams) {
  if (!ruleParams || !Object.keys(ruleParams).length) return tx;
  return tx.ruleParams(ruleParams);
}

export function boardTx(userId, board, sortOrder) {
  const bid = id();
  const range = defaultBoardRange();
  const from = board.from || range.from;
  const to = board.to || range.to;
  const txs = [
    db.tx.boards[bid]
      .update({
        name: board.name || '시간표',
        from,
        to,
        createdAt: Date.now(),
        sortOrder,
        colorLabels: board.colorLabels || '',
        // Written only when set so boards stay creatable before the schema
        // gains the attr (`npm run push:schema`).
        ...(board.repeatEvery ? { repeatEvery: board.repeatEvery } : {}),
      })
      .link({ owner: userId }),
  ];
  for (const e of board.events || []) {
    const f = eventFields(e);
    txs.push(
      db.tx.events[id()]
        .update({
          day: f.day,
          title: f.title,
          start: f.start,
          dur: f.dur,
          color: f.color,
          memo: f.memo,
          createdAt: Date.now(),
        })
        .link({ board: bid }),
    );
  }
  return { bid, txs };
}

export function createEventTx(boardId, fields, ruleParams) {
  const eid = id();
  const f = eventFields(fields);
  return {
    eid,
    tx: withRuleParams(
      db.tx.events[eid]
        .update({
          day: f.day,
          title: f.title,
          start: f.start,
          dur: f.dur,
          color: f.color,
          memo: f.memo,
          createdAt: Date.now(),
        })
        .link({ board: boardId }),
      ruleParams,
    ),
  };
}

export function patchEventTx(eid, patch, ruleParams) {
  const clean = {};
  for (const k of ['day', 'title', 'start', 'dur', 'color', 'memo']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (!Object.keys(clean).length) return null;
  return withRuleParams(db.tx.events[eid].update(clean), ruleParams);
}

export function saveEventTx(eid, fields, ruleParams) {
  const f = eventFields(fields);
  return withRuleParams(
    db.tx.events[eid].update({
      day: f.day,
      title: f.title,
      start: f.start,
      dur: f.dur,
      color: f.color,
      memo: f.memo,
    }),
    ruleParams,
  );
}

export function deleteEventTx(eid, ruleParams) {
  return withRuleParams(db.tx.events[eid].delete(), ruleParams);
}

export function patchBoardTx(bid, patch) {
  const clean = {};
  for (const k of ['name', 'from', 'to', 'repeatEvery', 'sortOrder', 'colorLabels']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (clean.colorLabels !== undefined && typeof clean.colorLabels === 'object') {
    clean.colorLabels = serializeColorLabels(clean.colorLabels);
  }
  if (!Object.keys(clean).length) return null;
  return db.tx.boards[bid].update(clean);
}

export function createShareTx(boardId, { token, secret, editSecret, mode, role, enabled = true }) {
  const sid = id();
  return {
    sid,
    tx: db.tx.shares[sid]
      .update({
        token,
        secret,
        mode,
        role,
        enabled,
        createdAt: Date.now(),
        ...(editSecret ? { editSecret } : {}),
      })
      .link({ board: boardId }),
  };
}

export function patchShareTx(shareId, patch) {
  const clean = {};
  for (const k of ['token', 'secret', 'editSecret', 'mode', 'role', 'enabled']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (!Object.keys(clean).length) return null;
  return db.tx.shares[shareId].update(clean);
}

export function deleteShareTx(shareId) {
  return db.tx.shares[shareId].delete();
}

export function createMemberTx(boardId, userId, role, email = '') {
  const mid = id();
  const normalizedRole = normalizeMemberRole(role);
  const txs = [
    db.tx.members[mid]
      .update({ role: normalizedRole, email: email || '', createdAt: Date.now() })
      .link({ board: boardId, user: userId }),
  ];
  // Write authority = boards.editors link only (members.role is display cache).
  if (isEditorRole(normalizedRole)) {
    txs.push(db.tx.boards[boardId].link({ editors: userId }));
  }
  return { mid, txs };
}

export function setMemberEditorTx(boardId, userId, isEditor) {
  return isEditor
    ? db.tx.boards[boardId].link({ editors: userId })
    : db.tx.boards[boardId].unlink({ editors: userId });
}

export function patchMemberTx(memberId, patch) {
  const clean = {};
  if (patch.role !== undefined) clean.role = normalizeMemberRole(patch.role);
  if (patch.email !== undefined) clean.email = patch.email;
  if (!Object.keys(clean).length) return null;
  return db.tx.members[memberId].update(clean);
}

export function setMemberRoleTxs(boardId, memberId, userId, role) {
  const normalizedRole = normalizeMemberRole(role);
  return [
    patchMemberTx(memberId, { role: normalizedRole }),
    setMemberEditorTx(boardId, userId, isEditorRole(normalizedRole)),
  ].filter(Boolean);
}

export function deleteMemberTx(memberId) {
  return db.tx.members[memberId].delete();
}

export function upsertBoardPrefsTx(prefsId, userId, boardId, patch) {
  const clean = {};
  for (const k of ['hiddenColors', 'hideWeekend', 'compact', 'showMemos']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (prefsId) {
    return db.tx.boardPrefs[prefsId].update(clean);
  }
  const pid = id();
  return db.tx.boardPrefs[pid].update(clean).link({ user: userId, board: boardId });
}

/** Build open or password share payload. editSecret only when role=editor. */
export async function buildShareSecrets({ mode, role, password, existingToken }) {
  const token = existingToken || randomToken();
  let secret;
  if (mode === 'password') {
    if (!password) throw new Error('비밀번호를 입력하세요');
    secret = await hashSharePassword(token, password);
  } else {
    secret = token;
  }
  return {
    token,
    secret,
    mode,
    role,
    // Instant: omit editSecret for viewers (don't write empty string).
    ...(role === 'editor' ? { editSecret: secret } : {}),
  };
}

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

export function createTodoTx(userId, { day, text, sortOrder }) {
  const tid = id();
  return {
    tid,
    tx: db.tx.todos[tid]
      .update({
        day,
        text: text.slice(0, 140),
        done: false,
        sortOrder,
        createdAt: Date.now(),
      })
      .link({ owner: userId }),
  };
}

export function setTodoDoneTx(tid, done) {
  return db.tx.todos[tid].update({ done });
}

export function deleteTodoTx(tid) {
  return db.tx.todos[tid].delete();
}

export function persistThemeTx(settings, theme) {
  if (!settings?.id) return null;
  return db.tx.settings[settings.id].update({ theme });
}

export { id };
