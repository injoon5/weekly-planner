import * as stylex from '@stylexjs/stylex';
import { account } from '../styles/account.js';

/** Entrance stagger per card (ms). */
export const STAGGER = 45;

export function Card({ index = 0, children }) {
  return (
    <section {...stylex.props(account.card)} style={{ animationDelay: `${index * STAGGER}ms` }}>
      {children}
    </section>
  );
}
