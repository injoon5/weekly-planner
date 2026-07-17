import { useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Copy,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { db, id } from '../instant.js';
import { commitTransaction } from '../transaction.js';
import { useTheme } from '../hooks/useTheme.js';
import { PEER_COLORS, peerColor } from '../hooks/useBoardPresence.js';
import { account } from '../styles/account.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { toast } from './ui/Toaster.jsx';
import { UiSelect } from './ui/UiSelect.jsx';
import { UpgradeDialog } from './UpgradeDialog.jsx';

const THEME_OPTS = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

function fmtStamp(ms) {
  if (!ms) return null;
  try {
    return new Intl.DateTimeFormat('ko', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(ms),
    );
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

function ProfileCard({ user, settings, saveSettings }) {
  const [name, setName] = useState(settings?.displayName || '');
  const savedName = settings?.displayName || '';
  const dirty = name.trim() !== savedName;
  const autoColor = peerColor(user?.email || '');
  const activeColor = PEER_COLORS.includes(settings?.presenceColor)
    ? settings.presenceColor
    : null;

  return (
    <section {...stylex.props(account.card)}>
      <h2 {...stylex.props(account.cardTitle)}>프로필</h2>
      <p {...stylex.props(account.cardHint)}>
        이름과 색은 함께 보는 사람들에게 커서와 아바타로 표시돼요.
      </p>

      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)}>이메일</span>
        <span {...stylex.props(account.rowValue)}>{user.email || '게스트 계정'}</span>
      </div>

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
            placeholder={user.email ? user.email.split('@')[0] : '손님'}
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" {...stylex.props(ui.btn, ui.btnPlain)} disabled={!dirty}>
            저장
          </button>
        </div>
      </form>

      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)}>내 색</span>
        <div {...stylex.props(account.swatches)}>
          <button
            type="button"
            {...stylex.props(account.swatch, account.swatchAuto, !activeColor && account.swatchOn)}
            title={`자동 (${autoColor})`}
            onClick={() => void saveSettings({ presenceColor: null }, '색을 바꿨어요')}
          >
            자동
          </button>
          {PEER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              {...stylex.props(account.swatch, activeColor === c && account.swatchOn)}
              style={{ backgroundColor: c }}
              aria-label={`아바타 색 ${c}`}
              onClick={() => void saveSettings({ presenceColor: c }, '색을 바꿨어요')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ThemeCard({ theme, persistTheme }) {
  return (
    <section {...stylex.props(account.card)}>
      <h2 {...stylex.props(account.cardTitle)}>화면</h2>
      <p {...stylex.props(account.cardHint)}>테마는 이 계정의 모든 기기에 적용돼요.</p>
      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)}>테마</span>
        <div {...stylex.props(account.rowControl)}>
          <UiSelect
            ariaLabel="테마"
            items={THEME_OPTS}
            value={theme === 'dark' ? 'dark' : 'light'}
            onValueChange={(next) => void persistTheme(next)}
          />
        </div>
      </div>
    </section>
  );
}

function TokensCard({ refreshToken }) {
  const { data } = db.useQuery({ apiTokens: {} });
  const tokens = useMemo(
    () =>
      [...(data?.apiTokens || [])].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [data],
  );

  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  // { id, token } — the only time a secret is ever visible.
  const [revealed, setRevealed] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast(err instanceof Error ? err.message : '요청을 처리하지 못했어요');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section {...stylex.props(account.card)}>
      <h2 {...stylex.props(account.cardTitle)}>API 토큰</h2>
      <p {...stylex.props(account.cardHint)}>
        REST API(<code>/api/v1</code>)에 <code>Authorization: Bearer</code> 헤더로 사용해요. 토큰은
        만들 때 한 번만 표시되고, 언제든 새로 고치거나 삭제할 수 있어요.
      </p>

      {tokens.length === 0 && <div {...stylex.props(account.empty)}>아직 토큰이 없어요</div>}

      {tokens.map((t) => (
        <div key={t.id} {...stylex.props(account.tokenRow)}>
          <span {...stylex.props(planner.ibtn)} aria-hidden="true" style={{ pointerEvents: 'none' }}>
            <KeyRound size={14} strokeWidth={1.75} />
          </span>
          <div {...stylex.props(account.tokenMeta)}>
            <span {...stylex.props(account.tokenName)}>{t.name || '이름 없는 토큰'}</span>
            <span {...stylex.props(account.tokenSub)}>
              {t.prefix}…{fmtStamp(t.lastUsedAt) ? ` · 마지막 사용 ${fmtStamp(t.lastUsedAt)}` : ' · 사용 전'}
            </span>
          </div>
          <button
            type="button"
            {...stylex.props(account.tokenBtn)}
            disabled={busy}
            title="토큰 새로 고침 — 기존 값은 즉시 무효화돼요"
            onClick={() =>
              void run(async () => {
                const out = await tokensRequest(refreshToken, { body: { rotate: t.id } });
                setRevealed({ id: t.id, token: out.token });
                toast('토큰을 새로 만들었어요');
              })
            }
          >
            <RefreshCw size={13} strokeWidth={1.75} />
            새로 고침
          </button>
          <button
            type="button"
            {...stylex.props(account.tokenBtn, account.tokenBtnDanger)}
            disabled={busy}
            title="토큰 삭제"
            onClick={() =>
              void run(async () => {
                await tokensRequest(refreshToken, { method: 'DELETE', body: { id: t.id } });
                if (revealed?.id === t.id) setRevealed(null);
                toast('토큰을 삭제했어요');
              })
            }
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        </div>
      ))}

      {revealed && (
        <div {...stylex.props(account.secret)}>
          {revealed.token}
          <div {...stylex.props(account.secretHint)}>
            지금 복사하세요 — 다시 표시되지 않아요.
          </div>
          <button
            type="button"
            {...stylex.props(account.tokenBtn)}
            onClick={() => void copyText(revealed.token)}
          >
            <Copy size={13} strokeWidth={1.75} />
            복사
          </button>
        </div>
      )}

      <form
        {...stylex.props(account.createRow)}
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const out = await tokensRequest(refreshToken, {
              body: { name: newName.trim() },
            });
            setRevealed({ id: out.id, token: out.token });
            setNewName('');
            toast('토큰을 만들었어요');
          });
        }}
      >
        <input
          {...stylex.props(ui.input, ui.inputSm)}
          placeholder="토큰 이름 (예: 자동화 스크립트)"
          maxLength={40}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" {...stylex.props(ui.btn, ui.btnPrimary)} disabled={busy}>
          <Plus size={14} strokeWidth={2} />
          만들기
        </button>
      </form>
    </section>
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
  const { theme, persistTheme } = useTheme(settings, toast);

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

        <ProfileCard user={user} settings={settings} saveSettings={saveSettings} />
        <ThemeCard theme={theme} persistTheme={persistTheme} />

        {isGuest ? (
          <section {...stylex.props(account.card)}>
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
          </section>
        ) : (
          <TokensCard refreshToken={user.refresh_token} />
        )}

        <section {...stylex.props(account.card)}>
          <div {...stylex.props(account.dangerZone)}>
            <div>
              <h2 {...stylex.props(account.cardTitle)}>로그아웃</h2>
              <p {...stylex.props(account.cardHint)} style={{ margin: 0 }}>
                이 기기에서 로그아웃해요.
              </p>
            </div>
            <button
              type="button"
              {...stylex.props(ui.btn, ui.btnPlain)}
              onClick={() => void db.auth.signOut()}
            >
              <LogOut size={14} strokeWidth={1.75} />
              로그아웃
            </button>
          </div>
        </section>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
