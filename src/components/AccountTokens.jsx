import { useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Copy, ExternalLink, KeyRound, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { db } from '../db/instant.js';
import { DOCS_URL } from '../lib/config.js';
import { account } from '../styles/account.js';
import { ui } from '../styles/ui.js';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { toast } from './ui/toast.js';
import { Card } from './AccountCard.jsx';

const DATE_FMT = new Intl.DateTimeFormat('ko', { dateStyle: 'medium', timeStyle: 'short' });

function fmtStamp(ms) {
  if (!ms) return null;
  try {
    return DATE_FMT.format(new Date(ms));
  } catch {
    return null;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('복사했어요');
  } catch {
    toast('복사하지 못했어요');
  }
}

/** POST/DELETE against /api/tokens with the session refresh token. */
async function tokensRequest(refreshToken, { method = 'POST', body } = {}) {
  const res = await fetch('/api/tokens', {
    method,
    headers: {
      'Content-Type': 'application/json',
      token: refreshToken || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || '요청을 처리하지 못했어요');
  return payload;
}

export function TokensCard({ index, refreshToken }) {
  const { data } = db.useQuery({ apiTokens: {} });
  const tokens = useMemo(
    () =>
      (data?.apiTokens || []).toSorted((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [data],
  );

  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  // { id, token } — the only time a secret is ever visible.
  const [revealed, setRevealed] = useState(null);

  const withBusy = async (work) => {
    setBusy(true);
    try {
      return await work();
    } catch (err) {
      toast(err instanceof Error ? err.message : '요청을 처리하지 못했어요');
      return null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card index={index}>
      <h2 {...stylex.props(account.cardTitle)}>API 토큰</h2>
      <p {...stylex.props(account.cardHint)}>
        REST API(<code>/api/v1</code>)에 <code>Authorization: Bearer</code> 헤더로 사용해요. 토큰은
        만들 때 한 번만 표시되고, 언제든 새로 고치거나 삭제할 수 있어요.{' '}
        <a
          href={`${DOCS_URL}/docs/api/rest`}
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(account.docLink)}
        >
          API 문서
          <ExternalLink size={11} strokeWidth={2} aria-hidden="true" />
        </a>
      </p>

      {tokens.length === 0 && (
        <div {...stylex.props(account.empty)}>
          아직 토큰이 없어요 — 아래에서 이름을 정하고 첫 토큰을 만들어 보세요.
        </div>
      )}

      {tokens.map((t) => (
        <div key={t.id} {...stylex.props(account.tokenRow)}>
          <span {...stylex.props(account.keyIcon)} aria-hidden="true">
            <KeyRound size={14} strokeWidth={1.75} />
          </span>
          <div {...stylex.props(account.tokenMeta)}>
            <span {...stylex.props(account.tokenName)}>{t.name || '이름 없는 토큰'}</span>
            <span {...stylex.props(account.tokenSub)}>
              {t.prefix}…
              {fmtStamp(t.lastUsedAt) ? ` · 마지막 사용 ${fmtStamp(t.lastUsedAt)}` : ' · 사용 전'}
            </span>
          </div>
          <button
            type="button"
            {...stylex.props(account.tokenBtn)}
            disabled={busy}
            title="기존 값은 즉시 무효화돼요"
            onClick={() => {
              void (async () => {
                const out = await withBusy(() =>
                  tokensRequest(refreshToken, { body: { rotate: t.id } }),
                );
                if (!out) return;
                setRevealed({ id: t.id, token: out.token });
                toast('토큰을 새로 만들었어요');
              })();
            }}
          >
            <RefreshCw size={13} strokeWidth={1.75} />
            새로 고침
          </button>
          <HoldToConfirm
            {...stylex.props(account.tokenBtn, account.tokenBtnDanger)}
            disabled={busy}
            title="길게 눌러 삭제"
            aria-label={`${t.name || '토큰'} 길게 눌러 삭제`}
            onConfirm={() => {
              void (async () => {
                const ok = await withBusy(() =>
                  tokensRequest(refreshToken, { method: 'DELETE', body: { id: t.id } }),
                );
                if (ok === null) return;
                setRevealed((prev) => (prev?.id === t.id ? null : prev));
                toast('토큰을 삭제했어요');
              })();
            }}
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </HoldToConfirm>
        </div>
      ))}

      {revealed && (
        <div {...stylex.props(account.secret)} role="status">
          <code {...stylex.props(account.secretCode)}>{revealed.token}</code>
          <div {...stylex.props(account.secretFoot)}>
            <span {...stylex.props(account.secretHint)}>
              지금 복사하세요 — 다시 표시되지 않아요.
            </span>
            <button
              type="button"
              {...stylex.props(account.tokenBtn)}
              onClick={() => void copyText(revealed.token)}
            >
              <Copy size={13} strokeWidth={1.75} />
              복사
            </button>
            <button
              type="button"
              {...stylex.props(account.tokenBtn)}
              aria-label="토큰 표시 닫기"
              onClick={() => setRevealed(null)}
            >
              <X size={13} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      <form
        {...stylex.props(account.createRow)}
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            const out = await withBusy(() =>
              tokensRequest(refreshToken, {
                body: { name: newName.trim() },
              }),
            );
            if (!out) return;
            setRevealed({ id: out.id, token: out.token });
            setNewName('');
            toast('토큰을 만들었어요');
          })();
        }}
      >
        <input
          {...stylex.props(ui.input, ui.inputSm)}
          placeholder="토큰 이름 (예: 자동화 스크립트)"
          aria-label="새 토큰 이름"
          maxLength={40}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          {...stylex.props(ui.btn, ui.btnPrimary, account.rowBtn)}
          disabled={busy}
        >
          <Plus size={14} strokeWidth={2} />
          만들기
        </button>
      </form>
    </Card>
  );
}
