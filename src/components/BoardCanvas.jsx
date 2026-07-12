import { Cursors } from '@instantdb/react';
import { WeekGrid } from './WeekGrid.jsx';

/** Week grid with optional Instant presence cursors — one wrap site. */
export function BoardCanvas({ room, myColor, ...gridProps }) {
  const grid = <WeekGrid {...gridProps} />;
  if (!room) return grid;
  return (
    <Cursors
      room={room}
      userCursorColor={myColor}
      style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
    >
      {grid}
    </Cursors>
  );
}
