import { useMemo, useRef, useState } from 'react';
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
import { commitTx } from '../db/commit.js';
import { useOverflowFade, pickFadeStyle } from '../hooks/useOverflowFade.js';
import { useTheme } from '../hooks/useTheme.js';
import { PEER_COLORS, peerColor } from '../presence/identity.js';
import { copyToClipboard } from '../lib/clipboard.js';
import { DOCS_URL } from '../lib/config.js';
import { sessionRequest } from '../lib/session-api.js';
import { t } from '../strings.js';
import { account } from '../styles/account.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { toast } from './ui/toast.js';
import { UiSelect } from './ui/UiSelect.jsx';
import { UpgradeDialog } from './UpgradeDialog.jsx';

const THEME_OPTS = [
  { value: 'light', label: t.account.themeLight },
  { value: 'dark', label: t.account.themeDark },
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

function lastUsedLabel(ms) {
  const stamp = fmtStamp(ms);
  return stamp ? t.account.lastUsed(stamp) : t.account.neverUsed;
}

async function copyText(text) {
  toast((await copyToClipboard(text)) ? t.account.toast.copied : t.account.toast.copyFailed);
}

/** POST/DELETE against /api/tokens with the session refresh token. */
async function tokensRequest(refreshToken, { method = 'POST', body } = {}) {
  const { ok, payload } = await sessionRequest('/api/tokens', { method, refreshToken, body });
  if (!ok) throw new Error(payload.error || t.account.toast.requestFailed);
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
  const { fade, updateFade, onWheel } = useOverflowFade(rowRef);

  const fadeStyle = pickFadeStyle(fade, {
    both: account.swatchesFadeBoth,
    left: account.swatchesFadeLeft,
    right: account.swatchesFadeRight,
  });

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
        title={t.account.autoColorTitle}
        onClick={() => onPick(null)}
      >
        <span {...stylex.props(account.swatchAutoDot)} style={{ backgroundColor: autoColor }} />
        {t.account.autoColor}
      </button>
      {PEER_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          {...stylex.props(account.swatch, activeColor === c && account.swatchOn)}
          style={{ backgroundColor: c }}
          aria-pressed={activeColor === c}
          aria-label={t.a11y.avatarColor(c)}
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

  const emailName = user.email ? user.email.split('@')[0] : t.app.guest;
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
          <span {...stylex.props(account.profileEmail)}>{user.email || t.account.guestAccount}</span>
        </div>
      </div>
      <p {...stylex.props(account.cardHint)}>
        {t.account.profileHint}
      </p>

      <form
        {...stylex.props(account.row)}
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) void saveSettings({ displayName: name.trim() }, t.account.toast.nameSaved);
        }}
      >
        <label {...stylex.props(account.rowLabel)} htmlFor="account-name">
          {t.account.displayName}
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
            {t.common.save}
          </button>
        </div>
      </form>

      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)} id="account-color-label">
          {t.account.myColor}
        </span>
        <ColorSwatches
          activeColor={activeColor}
          autoColor={autoColor}
          onPick={(c) => void saveSettings({ presenceColor: c }, t.account.toast.colorChanged)}
        />
      </div>
    </Card>
  );
}

function ThemeCard({ index, theme, persistTheme }) {
  return (
    <Card index={index}>
      <h2 {...stylex.props(account.cardTitle)}>{t.account.screen}</h2>
      <p {...stylex.props(account.cardHint)}>{t.account.themeAppliesAll}</p>
      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)}>{t.account.theme}</span>
        <div {...stylex.props(account.rowControl)}>
          <UiSelect
            ariaLabel={t.account.theme}
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
      toast(err instanceof Error ? err.message : t.account.toast.requestFailed);
      return null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card index={index}>
      <h2 {...stylex.props(account.cardTitle)}>{t.account.apiTokens}</h2>
      <p {...stylex.props(account.cardHint)}>
        {t.account.apiTokensHint}
        <code>/api/v1</code>
        {t.account.apiTokensHint2}
        <code>Authorization: Bearer</code>
        {t.account.apiTokensHint3}
        <a
          href={`${DOCS_URL}/docs/api/rest`}
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(account.docLink)}
        >
          {t.account.apiDocs}
          <ExternalLink size={11} strokeWidth={2} aria-hidden="true" />
        </a>
      </p>

      {tokens.length === 0 && (
        <div {...stylex.props(account.empty)}>{t.account.tokensEmpty}</div>
      )}

      {tokens.map((tok) => (
        <div key={tok.id} {...stylex.props(account.tokenRow)}>
          <span {...stylex.props(account.keyIcon)} aria-hidden="true">
            <KeyRound size={14} strokeWidth={1.75} />
          </span>
          <div {...stylex.props(account.tokenMeta)}>
            <span {...stylex.props(account.tokenName)}>{tok.name || t.account.unnamedToken}</span>
            <span {...stylex.props(account.tokenSub)}>
              {tok.prefix}…{lastUsedLabel(tok.lastUsedAt)}
            </span>
          </div>
          <button
            type="button"
            {...stylex.props(account.tokenBtn)}
            disabled={busy}
            title={t.account.refreshTitle}
            onClick={() => {
              void (async () => {
                const out = await withBusy(() =>
                  tokensRequest(refreshToken, { body: { rotate: tok.id } }),
                );
                if (!out) return;
                setRevealed({ id: tok.id, token: out.token });
                toast(t.account.toast.tokenRotated);
              })();
            }}
          >
            <RefreshCw size={13} strokeWidth={1.75} />
            {t.account.refresh}
          </button>
          <HoldToConfirm
            {...stylex.props(account.tokenBtn, account.tokenBtnDanger)}
            disabled={busy}
            title={t.account.holdToDelete}
            aria-label={t.a11y.tokenHoldDelete(tok.name || t.account.tokenFallback)}
            onConfirm={() => {
              void (async () => {
                const ok = await withBusy(() =>
                  tokensRequest(refreshToken, { method: 'DELETE', body: { id: tok.id } }),
                );
                if (ok === null) return;
                setRevealed((prev) => (prev?.id === tok.id ? null : prev));
                toast(t.account.toast.tokenDeleted);
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
              {t.account.copyNow}
            </span>
            <button
              type="button"
              {...stylex.props(account.tokenBtn)}
              onClick={() => void copyText(revealed.token)}
            >
              <Copy size={13} strokeWidth={1.75} />
              {t.common.copy}
            </button>
            <button
              type="button"
              {...stylex.props(account.tokenBtn)}
              aria-label={t.account.closeTokenReveal}
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
            toast(t.account.toast.tokenCreated);
          })();
        }}
      >
        <input
          {...stylex.props(ui.input, ui.inputSm)}
          placeholder={t.account.tokenNamePlaceholder}
          aria-label={t.account.newTokenName}
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
          {t.account.create}
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

  if (!user) {
    if (auth.isLoading) {
      return (
        <div {...stylex.props(planner.boot)} role="status" aria-live="polite">
          <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
          {t.common.loading}
        </div>
      );
    }
    return null;
  }
  if (error) {
    return (
      <div {...stylex.props(planner.boot)} role="alert">
        {t.common.errorPrefix(error.message)}
      </div>
    );
  }

  const saveSettings = async (patch, message) => {
    const tx = settings?.id
      ? db.tx.settings[settings.id].update(patch)
      : db.tx.settings[id()].update({ theme, ...patch }).link({ owner: user.id });
    const result = await commitTx(tx, t.account.toast.saveFailed);
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
            aria-label={t.account.backToPlanner}
            onClick={() => void navigate({ to: '/' })}
          >
            <ArrowLeft size={15} strokeWidth={1.75} />
          </button>
          <h1 {...stylex.props(account.title)}>{t.account.title}</h1>
        </div>

        {isLoading ? (
          <div {...stylex.props(planner.boot)} role="status" aria-live="polite">
            <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
            {t.common.loading}
          </div>
        ) : (
          <>
            <ProfileCard index={0} user={user} settings={settings} saveSettings={saveSettings} />
            <ThemeCard index={1} theme={theme} persistTheme={persistTheme} />

            {isGuest ? (
              <Card index={2}>
                <h2 {...stylex.props(account.cardTitle)}>{t.account.apiTokens}</h2>
                <p {...stylex.props(account.cardHint)}>
                  {t.account.guestTokensHint}
                </p>
                <button
                  type="button"
                  {...stylex.props(ui.btn, ui.btnPrimary)}
                  onClick={() => setUpgradeOpen(true)}
                >
                  <UserPlus size={14} strokeWidth={1.75} />
                  {t.account.createAccount}
                </button>
              </Card>
            ) : (
              <TokensCard index={2} refreshToken={user.refresh_token} />
            )}

            <Card index={3}>
              <div {...stylex.props(account.dangerZone)}>
                <div>
                  <h2 {...stylex.props(account.cardTitle)}>{t.account.signOut}</h2>
                  <p {...stylex.props(account.cardHint, account.cardHintTight)}>
                    {t.account.signOutHint}
                  </p>
                </div>
                <button
                  type="button"
                  {...stylex.props(ui.btn, ui.btnPlain, account.rowBtn)}
                  onClick={() => void db.auth.signOut()}
                >
                  <LogOut size={14} strokeWidth={1.75} />
                  {t.account.signOut}
                </button>
              </div>
            </Card>
          </>
        )}
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
