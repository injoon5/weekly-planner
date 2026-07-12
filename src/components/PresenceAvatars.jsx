import * as stylex from '@stylexjs/stylex';
import { planner } from '../styles/planner.js';

export function PresenceAvatars({ peers, max = 4 }) {
  if (!peers?.length) return null;
  const shown = peers.slice(0, max);
  const extra = peers.length - shown.length;

  return (
    <div {...stylex.props(planner.presence)} aria-label={`접속 중 ${peers.length}명`}>
      {shown.map((p) => (
        <span
          key={p.id}
          {...stylex.props(planner.presenceDot)}
          title={`${p.name}${p.role === 'editor' ? ' · 편집' : ' · 보기'}`}
          style={{ backgroundColor: p.color }}
        >
          {(p.name || '?').slice(0, 1).toUpperCase()}
        </span>
      ))}
      {extra > 0 && (
        <span {...stylex.props(planner.presenceMore)} title={`+${extra}`}>
          +{extra}
        </span>
      )}
    </div>
  );
}
