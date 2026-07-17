import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { db, id } from '../db/instant.js';
import { commitTransaction } from '../db/transaction.js';
import { useTheme } from '../hooks/useTheme.js';
import { PEER_COLORS, peerColor } from '../hooks/useBoardPresence.js';
import { DOCS_URL } from '../lib/config.js';
import { account } from '../styles/account.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { toast } from './ui/toast.js';
import { UiSelect } from './ui/UiSelect.jsx';
import { UpgradeDialog } from './UpgradeDialog.jsx';

const THEME_OPTS = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

/** Entrance stagger per card (ms). */
const STAGGER = 45;

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

function Card({ index = 0, children }) {
  return (
    <section {...stylex.props(account.card)} style={{ animationDelay: `${index * STAGGER}ms` }}>
      {children}
    </section>
  );
}

/** Presence color strip — always one line; soft edge fades when clipped. */
function ColorSwatches({ activeColor, autoColor, onPick }) {
  const rowRef = useRef(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFade = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  }, []);

  useLayoutEffect(() => {
    updateFade();
  }, [updateFade]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(updateFade);
    ro.observe(row);
    return () => ro.disconnect();
  }, [updateFade]);

  // Vertical wheel → sideways scroll when the strip overflows (narrow windows).
  const onWheel = (e) => {
    const el = rowRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    el.scrollLeft += e.deltaY;
  };

  const fadeStyle =
    fade.left && fade.right
      ? account.swatchesFadeBoth
      : fade.left
        ? account.swatchesFadeLeft
        : fade.right
          ? account.swatchesFadeRight
          : null;

  return (
    <div
      ref={rowRef}
      {...stylex.props(account.swatches, fadeStyle)}
      role="group"
      aria-labelledby="account-color-label"
      onScroll={updateFade}
      onWheel={onWheel}
    >
      <button
        type="button"
        {...stylex.props(account.swatch, account.swatchAuto, !activeColor && account.swatchOn)}
        aria-pressed={!activeColor}
        title="이메일에서 자동으로 정해진 색"
        onClick={() => onPick(null)}
      >
        <span {...stylex.props(account.swatchAutoDot)} style={{ backgroundColor: autoColor }} />
        자동
      </button>
      {PEER_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          {...stylex.props(account.swatch, activeColor === c && account.swatchOn)}
          style={{ backgroundColor: c }}
          aria-pressed={activeColor === c}
          aria-label={`아바타 색 ${c}`}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
}

function ProfileCard({ index, user, settings, saveSettings }) {
  const [name, setName] = useState(settings?.displayName || '');
  const savedName = settings?.displayName || '';
  const dirty = name.trim() !== savedName;

  const emailName = user.email ? user.email.split('@')[0] : '손님';
  const autoColor = peerColor(user?.email || '');
  const activeColor = PEER_COLORS.includes(settings?.presenceColor)
    ? settings.presenceColor
    : null;

  // Preview follows the draft, so the avatar reacts while typing.
  const previewName = name.trim() || savedName || emailName;
  const previewColor = activeColor || autoColor;

  return (
    <Card index={index}>
      <div {...stylex.props(account.profileHead)}>
        <span
          {...stylex.props(account.avatar)}
          aria-hidden="true"
          style={{ backgroundColor: previewColor }}
        >
          {previewName.slice(0, 1).toUpperCase()}
        </span>
        <div {...stylex.props(account.profileMeta)}>
          <h2 {...stylex.props(account.profileName)}>{previewName}</h2>
          <span {...stylex.props(account.profileEmail)}>{user.email || '게스트 계정'}</span>
        </div>
      </div>
      <p {...stylex.props(account.cardHint)}>
        이름과 색은 함께 보는 사람들에게 아바타와 커서로 표시돼요.
      </p>

      <form
        {...stylex.props(account.row)}
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) void saveSettings({ displayName: name.trim() }, '이름을 저장했어요');
        }}
      >
        <label {...stylex.props(account.rowLabel)} htmlFor="account-name">
          표시 이름
        </label>
        <div {...stylex.props(account.rowControl)}>
          <input
            id="account-name"
            {...stylex.props(ui.input, ui.inputSm)}
            placeholder={emailName}
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            {...stylex.props(ui.btn, ui.btnPlain, account.rowBtn)}
            disabled={!dirty}
          >
            저장
          </button>
        </div>
      </form>

      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)} id="account-color-label">
          내 색
        </span>
        <ColorSwatches
          activeColor={activeColor}
          autoColor={autoColor}
          onPick={(c) => void saveSettings({ presenceColor: c }, '색을 바꿨어요')}
        />
      </div>
    </Card>
  );
}

function ThemeCard({ index, theme, persistTheme }) {
  return (
    <Card index={index}>
      <h2 {...stylex.props(account.cardTitle)}>화면</h2>
      <p {...stylex.props(account.cardHint)}>테마는 이 계정의 모든 기기에 적용돼요.</p>
      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)}>테마</span>
        <div {...stylex.props(account.rowControl)}>
          <UiSelect
            ariaLabel="테마"
            items={THEME_OPTS}
            value={theme === 'dark' ? 'dark' : 'light'}
            xstyle={account.themeSelect}
            onValueChange={(next) => void persistTheme(next)}
          />
        </div>
      </div>
    </Card>
  );
}

function TokensCard({ index, refreshToken }) {
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

export function Account() {
  const auth = db.useAuth();
  const navigate = useNavigate();
  const user = auth.user;
  const isGuest = Boolean(user?.isGuest);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data, isLoading, error } = db.useQuery(user ? { settings: {} } : null);
  const settings = data?.settings?.[0] || null;
  const { theme, persistTheme } = useTheme(settings);

  if (!user || isLoading) {
    return <div {...stylex.props(planner.boot)}>불러오는 중…</div>;
  }
  if (error) {
    return <div {...stylex.props(planner.boot)}>오류: {error.message}</div>;
  }

  const saveSettings = async (patch, message) => {
    const tx = settings?.id
      ? db.tx.settings[settings.id].update(patch)
      : db.tx.settings[id()].update({ theme, ...patch }).link({ owner: user.id });
    const result = await commitTransaction((t) => db.transact(t), tx, {
      message: '저장하지 못했어요',
      onError: toast,
    });
    if (result.ok && message) toast(message);
    return result;
  };

  return (
    <div {...stylex.props(account.root)}>
      <div {...stylex.props(account.shell)}>
        <div {...stylex.props(account.topRow)}>
          <button
            type="button"
            {...stylex.props(planner.ibtn)}
            aria-label="시간표로 돌아가기"
            onClick={() => void navigate({ to: '/' })}
          >
            <ArrowLeft size={15} strokeWidth={1.75} />
          </button>
          <h1 {...stylex.props(account.title)}>계정 설정</h1>
        </div>

        <ProfileCard index={0} user={user} settings={settings} saveSettings={saveSettings} />
        <ThemeCard index={1} theme={theme} persistTheme={persistTheme} />

        {isGuest ? (
          <Card index={2}>
            <h2 {...stylex.props(account.cardTitle)}>API 토큰</h2>
            <p {...stylex.props(account.cardHint)}>
              게스트 모드에서는 API 토큰을 만들 수 없어요. 계정을 만들면 데이터가 저장되고 REST
              API도 쓸 수 있어요.
            </p>
            <button
              type="button"
              {...stylex.props(ui.btn, ui.btnPrimary)}
              onClick={() => setUpgradeOpen(true)}
            >
              <UserPlus size={14} strokeWidth={1.75} />
              계정 만들기
            </button>
          </Card>
        ) : (
          <TokensCard index={2} refreshToken={user.refresh_token} />
        )}

        <Card index={3}>
          <div {...stylex.props(account.dangerZone)}>
            <div>
              <h2 {...stylex.props(account.cardTitle)}>로그아웃</h2>
              <p {...stylex.props(account.cardHint, account.cardHintTight)}>
                이 기기에서 로그아웃해요.
              </p>
            </div>
            <button
              type="button"
              {...stylex.props(ui.btn, ui.btnPlain, account.rowBtn)}
              onClick={() => void db.auth.signOut()}
            >
              <LogOut size={14} strokeWidth={1.75} />
              로그아웃
            </button>
          </div>
        </Card>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
