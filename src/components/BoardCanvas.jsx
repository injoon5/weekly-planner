import { WeekGrid } from './WeekGrid.jsx';

/** Week grid with optional Instant presence cursors — one wrap site. */
export function BoardCanvas({ room, myColor, ...gridProps }) {
  return <WeekGrid {...gridProps} presenceRoom={room} presenceColor={myColor} />;
}
