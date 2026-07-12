import { useState, useRef, useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { auth } from '../styles/auth.js';

export function CodeInputs({ disabled, shake, onComplete, onChange }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [ready, setReady] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    const focusT = setTimeout(() => refs.current[0]?.focus(), 60);
    return () => {
      cancelAnimationFrame(t);
      clearTimeout(focusT);
    };
  }, []);

  useEffect(() => {
    if (!shake) return;
    setDigits(['', '', '', '', '', '']);
    onChange?.('');
    const t = setTimeout(() => refs.current[0]?.focus(), 40);
    return () => clearTimeout(t);
  }, [shake]);

  const emit = next => {
    const code = next.join('');
    onChange?.(code);
    if (next.every(d => d) && next.length === 6) onComplete?.(code);
  };

  const setAt = (i, val) => {
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    emit(next);
  };

  const onInput = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAt(i, '');
      return;
    }
    if (raw.length > 1) {
      const chars = raw.slice(0, 6 - i).split('');
      const next = [...digits];
      chars.forEach((c, k) => {
        next[i + k] = c;
      });
      setDigits(next);
      emit(next);
      refs.current[Math.min(i + chars.length, 5)]?.focus();
      return;
    }
    setAt(i, raw);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        setAt(i, '');
        return;
      }
      if (i > 0) {
        e.preventDefault();
        setAt(i - 1, '');
        refs.current[i - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && i < 5) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  const onPaste = e => {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const filled = ['', '', '', '', '', ''];
    for (let k = 0; k < text.length; k++) filled[k] = text[k];
    setDigits(filled);
    emit(filled);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  // Stagger delays (ms) per cell: 0, 40, 80, 120, 160, 200
  const delays = [0, 40, 80, 120, 160, 200];

  return (
    <div
      {...stylex.props(auth.otp, shake && auth.otpShake)}
      data-ready={ready || undefined}
      role="group"
      aria-label="인증 코드"
      onPaste={onPaste}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          {...stylex.props(auth.otpCell)}
          style={{
            transitionDelay: ready ? `0ms, 0ms, 0ms, ${delays[i]}ms, ${delays[i]}ms` : undefined,
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0) scale(1)' : 'translateY(6px) scale(.96)',
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          aria-label={`${i + 1}번째 자리`}
          value={d}
          disabled={disabled}
          onInput={e => onInput(i, e)}
          onKeyDown={e => onKeyDown(i, e)}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  );
}
