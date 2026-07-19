import * as stylex from '@stylexjs/stylex';
import { planner } from '../../styles/planner.js';

/**
 * Spinner + status text used by every "loading…" gate. Two layouts:
 * - `surface` (default): fills the planner surface area (aria-busy).
 * - `boot`: compact full-height boot gate (aria-live polite).
 *
 * @param {{ variant?: 'surface' | 'boot', children: import('react').ReactNode }} props
 */
export function LoadingStatus({ variant = 'surface', children }) {
  return (
    <div
      {...stylex.props(variant === 'boot' ? planner.boot : planner.surfacePending)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
      {children}
    </div>
  );
}
