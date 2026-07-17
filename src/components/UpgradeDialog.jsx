import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { X } from 'lucide-react';
import { useMagicCodeAuth } from '../hooks/useMagicCodeAuth.js';
import { auth } from '../styles/auth.js';
import { editor } from '../styles/editor.js';
import { ui } from '../styles/ui.js';
import { CodeInputs } from './CodeInputs.jsx';
import { Sheet } from './ui/Sheet.jsx';

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
                {sentEmail ? '코드 입력' : '계정 만들기'}
              </Sheet.Title>
              <Sheet.Close {...stylex.props(editor.icobtn)} aria-label="닫기">
                <X size={16} strokeWidth={2} />
              </Sheet.Close>
            </div>

            {!sentEmail ? (
              <div key="email" {...stylex.props(auth.step, auth.stepEnter)}>
                <p {...stylex.props(auth.copy)} style={{ marginTop: 0 }}>
                  이메일을 연결하면 지금까지 만든 시간표를 그대로 유지하면서 어느 기기에서나 로그인할
                  수 있어요.
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
                    {busy ? '보내는 중…' : '코드 받기'}
                  </button>
                </form>
              </div>
            ) : (
              <div key="code" {...stylex.props(auth.step, auth.stepEnter)}>
                <p {...stylex.props(auth.copy)} style={{ marginTop: 0 }}>
                  <strong>{sentEmail}</strong>으로 보낸 6자리 코드를 입력하세요.
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
                    {busy ? '확인 중…' : '계정 저장하기'}
                  </button>
                </form>
                <button
                  {...stylex.props(ui.btn, ui.btnGhost, auth.back)}
                  type="button"
                  disabled={busy}
                  onClick={backToEmail}
                >
                  다른 이메일
                </button>
              </div>
            )}
          </Sheet.Popup>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
