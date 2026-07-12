import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { menus } from '../styles/menus.js';

const HOLD_MS = 900;
const EASE_BACK = 'clip-path 180ms cubic-bezier(0.2, 0, 0, 1)';

/**
 * Press-and-hold confirm. Red fill grows L→R via clip-path; release cancels.
 * On complete, fill stays full until pointer lifts.
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
  const doneRef = useRef(false);
  const holdingRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const clearTick = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const endHold = () => {
    if (!holdingRef.current && !doneRef.current) return;
    holdingRef.current = false;
    clearTick();
    if (doneRef.current) {
      doneRef.current = false;
      setProgress(0);
      setEasingOut(false);
      return;
    }
    setEasingOut(true);
    setProgress(0);
  };

  const tick = (now) => {
    if (!holdingRef.current) return;
    const p = Math.min(1, (now - startRef.current) / duration);
    setProgress(p);
    if (p >= 1) {
      holdingRef.current = false;
      doneRef.current = true;
      clearTick();
      setProgress(1);
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
      onConfirm();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startHold = (e) => {
    if (disabled || holdingRef.current || doneRef.current) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    holdingRef.current = true;
    doneRef.current = false;
    setEasingOut(false);
    startRef.current = performance.now();
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
    endHold();
  };

  const clipped = `inset(0 ${(1 - progress) * 100}% 0 0)`;

  return (
    <button
      type="button"
      {...rest}
      disabled={disabled}
      title={title}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onLostPointerCapture={endHold}
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
