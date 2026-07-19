import { t } from '../strings.js';
import { useState, useRef, useEffect } from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import * as stylex from '@stylexjs/stylex';
import { auth } from '../styles/auth.js';

const LENGTH = 6;
// Stagger delays (ms) per cell for the entrance transition.
const delays = [0, 40, 80, 120, 160, 200];

/**
 * 6-digit login code (Base UI OTPField): typing, paste distribution,
 * backspace/arrow navigation and one-time-code autofill are built in.
 */
export function CodeInputs({ value, disabled, shake, onComplete, onChange }) {
  const [ready, setReady] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    const focusT = setTimeout(() => rootRef.current?.querySelector('input')?.focus(), 60);
    return () => {
      cancelAnimationFrame(t);
      clearTimeout(focusT);
    };
  }, []);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => rootRef.current?.querySelector('input')?.focus(), 40);
    return () => clearTimeout(t);
  }, [shake]);

  return (
    <OTPField.Root
      ref={rootRef}
      length={LENGTH}
      value={value}
      validationType="numeric"
      disabled={disabled}
      onValueChange={(v) => onChange?.(v)}
      onValueComplete={(v) => onComplete?.(v)}
      {...stylex.props(auth.otp, shake && auth.otpShake)}
      data-ready={ready || undefined}
      aria-label={t.auth.codeInputLabel}
    >
      {Array.from({ length: LENGTH }, (_, i) => (
        <OTPField.Input
          key={i}
          {...stylex.props(auth.otpCell)}
          style={{
            transitionDelay: ready ? `0ms, 0ms, 0ms, ${delays[i]}ms, ${delays[i]}ms` : undefined,
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0) scale(1)' : 'translateY(6px) scale(.96)',
          }}
          aria-label={t.auth.codeDigit(i + 1)}
        />
      ))}
    </OTPField.Root>
  );
}
