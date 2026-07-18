import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { menus } from '../styles/menus.js';
import { toast } from './ui/toast.js';

const HOLD_MS = 900;
const EASE_BACK = 'clip-path 180ms cubic-bezier(0.2, 0, 0, 1)';
const HOLD_HINT = '길게 누르고 있으세요';
/** Only hint when the press looked like a tap, not a deliberate cancel. */
const HINT_BELOW = 0.5;

function isInside(e) {
  const el = e.currentTarget;
  if (!el?.getBoundingClientRect) return true;
  const r = el.getBoundingClientRect();
  const x = e.clientX;
  const y = e.clientY;
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

/**
 * Press-and-hold confirm. Fill grows L→R; confirm only on release once full.
 */
export function HoldToConfirm({
  onConfirm,
  disabled,
  duration = HOLD_MS,
  title,
  children,
  ...rest
}) {
  const [progress, setProgress] = useState(0);
  const [easingOut, setEasingOut] = useState(false);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const progressRef = useRef(0);
  const armedRef = useRef(false);
  const holdingRef = useRef(false);
  const confirmRef = useRef(onConfirm);

  useEffect(() => {
    confirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const clearTick = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const hintIfTap = () => {
    if (progressRef.current < HINT_BELOW) toast(HOLD_HINT);
  };

  const abortHold = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    armedRef.current = false;
    clearTick();
    setEasingOut(true);
    setProgress(0);
    hintIfTap();
  };

  const releaseHold = (e) => {
    if (!holdingRef.current) return;
    if (e && !isInside(e)) {
      abortHold();
      return;
    }
    holdingRef.current = false;
    clearTick();
    const armed = armedRef.current;
    armedRef.current = false;
    if (armed) {
      setProgress(0);
      setEasingOut(false);
      confirmRef.current?.();
      return;
    }
    setEasingOut(true);
    setProgress(0);
    hintIfTap();
  };

  const tick = (now) => {
    if (!holdingRef.current) return;
    const p = Math.min(1, (now - startRef.current) / duration);
    progressRef.current = p;
    setProgress(p);
    if (p >= 1) {
      armedRef.current = true;
      clearTick();
      progressRef.current = 1;
      setProgress(1);
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startHold = (e) => {
    if (disabled || holdingRef.current) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    holdingRef.current = true;
    armedRef.current = false;
    setEasingOut(false);
    startRef.current = performance.now();
    progressRef.current = 0;
    setProgress(0);
    if (e.currentTarget?.setPointerCapture && e.pointerId != null) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (e.repeat) return;
    e.preventDefault();
    startHold(e);
  };

  const onKeyUp = (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    releaseHold();
  };

  const clipped = `inset(0 ${(1 - progress) * 100}% 0 0)`;

  return (
    <button
      type="button"
      {...rest}
      disabled={disabled}
      title={title}
      onPointerDown={startHold}
      onPointerUp={releaseHold}
      onPointerCancel={abortHold}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span
        aria-hidden
        {...stylex.props(menus.holdFill)}
        style={{
          clipPath: clipped,
          transition: easingOut && progress === 0 ? EASE_BACK : 'none',
        }}
      />
      <span {...stylex.props(menus.holdContent)}>{children}</span>
    </button>
  );
}
