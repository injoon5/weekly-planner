import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { X } from 'lucide-react';
import { useMagicCodeAuth } from '../hooks/useMagicCodeAuth.js';
import { auth } from '../styles/auth.js';
import { editor } from '../styles/editor.js';
import { ui } from '../styles/ui.js';
import { CodeInputs } from './CodeInputs.jsx';
import { t } from '../strings.js';
import { Sheet } from './ui/sheet.js';

/**
 * Upgrades a guest into a permanent account with a magic code. Instant links the
 * signed-in guest to the verified email, so everything they created as a guest
 * carries over — no migration on our side.
 */
export function UpgradeDialog({ open, onOpenChange }) {
  const {
    sentEmail,
    busy,
    err,
    shake,
    code,
    setCode,
    emailRef,
    isCodeComplete,
    sendCode,
    verify,
    backToEmail,
    reset,
  } = useMagicCodeAuth({
    onVerified: () => onOpenChange(false),
  });

  // Reset to the first step whenever the sheet reopens.
  useEffect(() => {
    if (!open) return;
    reset();
    // reset is stable enough for open transitions; avoid re-running on identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      <Sheet.Portal>
        <Sheet.Backdrop {...stylex.props(editor.scrim)} />
        <Sheet.Viewport>
          <Sheet.Popup {...stylex.props(editor.dlg)}>
            <div {...stylex.props(editor.dhead)}>
              <Sheet.Title {...stylex.props(editor.dttl)}>
                {sentEmail ? t.upgrade.codeTitle : t.upgrade.createAccount}
              </Sheet.Title>
              <Sheet.Close {...stylex.props(editor.icobtn)} aria-label={t.common.close}>
                <X size={16} strokeWidth={2} />
              </Sheet.Close>
            </div>

            {!sentEmail ? (
              <div key="email" {...stylex.props(auth.step, auth.stepEnter)}>
                <p {...stylex.props(auth.copy)} style={{ marginTop: 0 }}>
                  {t.upgrade.intro}
                </p>
                {err && (
                  <div {...stylex.props(auth.err)} role="alert">
                    {err}
                  </div>
                )}
                <form {...stylex.props(auth.form)} onSubmit={sendCode}>
                  <input
                    ref={emailRef}
                    {...stylex.props(ui.input)}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="email@example.com"
                    required
                    autoFocus
                    disabled={busy}
                  />
                  <button
                    {...stylex.props(ui.btn, ui.btnPrimary, auth.formPrimary)}
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? t.common.sending : t.auth.sendCode}
                  </button>
                </form>
              </div>
            ) : (
              <div key="code" {...stylex.props(auth.step, auth.stepEnter)}>
                <p {...stylex.props(auth.copy)} style={{ marginTop: 0 }}>
                  <strong>{sentEmail}</strong>{t.auth.codeSentSuffix}
                </p>
                {err && (
                  <div {...stylex.props(auth.err)} role="alert">
                    {err}
                  </div>
                )}
                <form
                  {...stylex.props(auth.form)}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!isCodeComplete || busy) return;
                    verify();
                  }}
                >
                  <CodeInputs
                    value={code}
                    disabled={busy}
                    shake={shake}
                    onChange={setCode}
                    onComplete={(c) => verify(c)}
                  />
                  <button
                    {...stylex.props(ui.btn, ui.btnPrimary, auth.formPrimary)}
                    type="submit"
                    disabled={busy || !isCodeComplete}
                    aria-disabled={busy || !isCodeComplete}
                  >
                    {busy ? t.common.checking : t.upgrade.saveAccount}
                  </button>
                </form>
                <button
                  {...stylex.props(ui.btn, ui.btnGhost, auth.back)}
                  type="button"
                  disabled={busy}
                  onClick={backToEmail}
                >
                  {t.auth.backToEmail}
                </button>
              </div>
            )}
          </Sheet.Popup>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
