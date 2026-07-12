import { useState, useRef } from 'react';
import * as stylex from '@stylexjs/stylex';
import { db } from '../db.js';
import { auth } from '../styles/auth.js';
import { ui } from '../styles/ui.js';
import { CodeInputs } from './CodeInputs.jsx';

export function Login() {
  const [sentEmail, setSentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(0);
  const [code, setCode] = useState('');
  const emailRef = useRef();
  const submitting = useRef(false);

  const sendCode = async e => {
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

  const verify = async codeVal => {
    const c = (codeVal || code || '').trim();
    if (c.length !== 6 || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setErr('');
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code: c });
    } catch (ex) {
      setErr(ex?.body?.message || ex?.message || '코드가 올바르지 않아요');
      setShake(s => s + 1);
      setCode('');
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  };

  const isCodeComplete = /^\d{6}$/.test(code);

  return (
    <div {...stylex.props(auth.root)}>
      <div {...stylex.props(auth.card)}>
        <div {...stylex.props(auth.mark)} aria-hidden="true">
          <i {...stylex.props(auth.markA)} />
          <i {...stylex.props(auth.markB)} />
        </div>

        {!sentEmail ? (
          <div {...stylex.props(auth.step, auth.stepEnter)} key="email">
            <h1 {...stylex.props(auth.title)}>주간 계획표</h1>
            <p {...stylex.props(auth.copy)}>
              이메일로 로그인 코드를 보내드려요. 계정이 없으면 자동으로 만들어집니다.
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
            <h1 {...stylex.props(auth.title)}>코드 입력</h1>
            <p {...stylex.props(auth.copy)}>
              <strong>{sentEmail}</strong>으로 보낸 6자리 코드를 입력하세요.
            </p>
            {err && (
              <div {...stylex.props(auth.err)} role="alert">
                {err}
              </div>
            )}
            <form
              {...stylex.props(auth.form)}
              onSubmit={e => {
                e.preventDefault();
                if (!isCodeComplete || busy) return;
                verify();
              }}
            >
              <CodeInputs
                disabled={busy}
                shake={shake}
                onChange={setCode}
                onComplete={c => verify(c)}
              />
              <button
                {...stylex.props(ui.btn, ui.btnPrimary, auth.formPrimary)}
                type="submit"
                disabled={busy || !isCodeComplete}
                aria-disabled={busy || !isCodeComplete}
              >
                {busy ? '확인 중…' : '로그인'}
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
      </div>
    </div>
  );
}
