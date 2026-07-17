import * as stylex from '@stylexjs/stylex';
import { useMagicCodeAuth } from '../hooks/useMagicCodeAuth.js';
import { auth } from '../styles/auth.js';
import { ui } from '../styles/ui.js';
import { CodeInputs } from './CodeInputs.jsx';

export function Login() {
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
  } = useMagicCodeAuth();

  return (
    <main {...stylex.props(auth.root)}>
      <div {...stylex.props(auth.card)}>
        <div {...stylex.props(ui.mark, auth.markGap)} aria-hidden="true">
          <i {...stylex.props(ui.markA)} />
          <i {...stylex.props(ui.markB)} />
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
                {busy ? '확인 중…' : '로그인'}
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
      </div>
    </main>
  );
}
