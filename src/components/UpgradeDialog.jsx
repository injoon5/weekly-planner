import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { X } from 'lucide-react';
import { db } from '../db.js';
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
  const [sentEmail, setSentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(0);
  const [code, setCode] = useState('');
  const emailRef = useRef();
  const submitting = useRef(false);

  // Reset to the first step whenever the sheet reopens.
  useEffect(() => {
    if (!open) return;
    setSentEmail('');
    setErr('');
    setCode('');
    setShake(0);
  }, [open]);

  const sendCode = async (e) => {
    e.preventDefault();
    const email = (emailRef.current?.value || '').trim();
    if (!email) return;
    setBusy(true);
    setErr('');
    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
      setCode('');
    } catch (ex) {
      setErr(ex?.body?.message || ex?.message || '코드를 보내지 못했어요');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (codeVal) => {
    const c = (codeVal || code || '').trim();
    if (c.length !== 6 || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setErr('');
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code: c });
      // Guest is now a permanent user; close and let the app re-render.
      onOpenChange(false);
    } catch (ex) {
      setErr(ex?.body?.message || ex?.message || '코드가 올바르지 않아요');
      setShake((s) => s + 1);
      setCode('');
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  };

  const isCodeComplete = /^\d{6}$/.test(code);

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
              <div {...stylex.props(auth.step, auth.stepEnter)} key="email">
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
              <div {...stylex.props(auth.step, auth.stepEnter)} key="code">
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
                  onClick={() => {
                    setSentEmail('');
                    setErr('');
                    setCode('');
                    setShake(0);
                  }}
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
