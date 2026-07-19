import * as stylex from '@stylexjs/stylex';
import { useMagicCodeAuth } from '../hooks/useMagicCodeAuth.js';
import { auth } from '../styles/auth.js';
import { ui } from '../styles/ui.js';
import { CodeInputs } from './CodeInputs.jsx';
import { t } from '../strings.js';

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
          <div key="email" {...stylex.props(auth.step, auth.stepEnter)}>
            <h1 {...stylex.props(auth.title)}>{t.auth.title}</h1>
            <p {...stylex.props(auth.copy)}>
              {t.auth.emailHint}
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
            <h1 {...stylex.props(auth.title)}>{t.auth.codeTitle}</h1>
            <p {...stylex.props(auth.copy)}>
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
                {busy ? t.common.checking : t.common.login}
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
      </div>
    </main>
  );
}
