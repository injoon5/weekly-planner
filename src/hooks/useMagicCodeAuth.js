import { useRef, useState } from 'react';
import { db } from '../db/instant.js';
import { t } from '../strings.js';

/**
 * Shared magic-code email auth flow for Login + UpgradeDialog.
 * @param {{ onVerified?: () => void }} [options]
 */
export function useMagicCodeAuth({ onVerified } = {}) {
  const [sentEmail, setSentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(0);
  const [code, setCode] = useState('');
  const emailRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const submitting = useRef(false);

  const reset = () => {
    setSentEmail('');
    setErr('');
    setCode('');
    setShake(0);
  };

  const sendCode = async (e) => {
    e?.preventDefault?.();
    const email = (emailRef.current?.value || '').trim();
    if (!email) return;
    setBusy(true);
    setErr('');
    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
      setCode('');
    } catch (ex) {
      setErr(ex?.body?.message || ex?.message || t.auth.err.sendCode);
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
      onVerified?.();
    } catch (ex) {
      setErr(ex?.body?.message || ex?.message || t.auth.err.badCode);
      setShake((s) => s + 1);
      setCode('');
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  };

  const backToEmail = () => {
    setSentEmail('');
    setErr('');
    setCode('');
    setShake(0);
  };

  return {
    sentEmail,
    busy,
    err,
    shake,
    code,
    setCode,
    emailRef,
    isCodeComplete: /^\d{6}$/.test(code),
    sendCode,
    verify,
    backToEmail,
    reset,
  };
}
