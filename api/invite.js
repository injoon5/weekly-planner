import { init, id } from '@instantdb/admin';
import { linkedId } from '../src/links.js';
import {
  createMemberTxs,
  findMemberForUser,
  memberRoleTxs,
} from '../src/member-policy.js';
import { normalizeMemberRole } from '../src/roles.js';
import schema from '../src/schema.js';

const APP_ID = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, token');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Invite a registered Instant user to a board.
 * POST { boardId, email, role: 'viewer'|'editor' }
 * Header `token` may also carry the refresh token.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!APP_ID || !ADMIN_TOKEN) {
    return json(res, 500, { error: '서버 설정이 없어요' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: '잘못된 요청이에요' });
  }

  const refreshToken = req.headers.token || body.refreshToken;
  const boardId = body.boardId;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = normalizeMemberRole(body.role);

  if (!refreshToken || !boardId || !email) {
    return json(res, 400, { error: '필수 값이 없어요' });
  }

  const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

  try {
    const caller = await db.auth.verifyToken(refreshToken);
    if (!caller?.id) {
      return json(res, 401, { error: '로그인이 필요해요' });
    }

    const { boards } = await db.query({
      boards: {
        $: { where: { id: boardId } },
        owner: {},
        members: { user: {} },
      },
    });
    const board = boards?.[0];
    if (!board) {
      return json(res, 404, { error: '시간표를 찾을 수 없어요' });
    }
    const ownerId = linkedId(board.owner);
    if (ownerId !== caller.id) {
      return json(res, 403, { error: '소유자만 초대할 수 있어요' });
    }

    let target;
    try {
      target = await db.auth.getUser({ email });
    } catch {
      target = null;
    }
    if (!target?.id) {
      return json(res, 404, { error: '등록된 사용자만 초대할 수 있어요' });
    }
    if (target.id === caller.id) {
      return json(res, 400, { error: '자기 자신은 초대할 수 없어요' });
    }

    const existing = findMemberForUser(board.members, target.id);
    if (existing) {
      await db.transact(
        memberRoleTxs(db.tx, {
          boardId,
          memberId: existing.id,
          userId: target.id,
          role,
        }),
      );
      return json(res, 200, { ok: true, memberId: existing.id, updated: true });
    }

    const mid = id();
    const { txs } = createMemberTxs(db.tx, {
      boardId,
      userId: target.id,
      role,
      email,
      memberId: mid,
    });
    await db.transact(txs);
    return json(res, 200, { ok: true, memberId: mid, updated: false });
  } catch (err) {
    console.error('invite failed', err);
    return json(res, 500, { error: '초대에 실패했어요' });
  }
}
