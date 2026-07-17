import { useEffect, useRef } from 'react';
import { contentPointFromPane, gridCursorSpaceId } from '../grid/grid-cursors.js';

function CursorGlyph({ color }) {
  const size = 35;
  const fill = color || 'black';

  return (
    <svg
      style={{ height: size, width: size }}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g
        fill="rgba(0,0,0,.2)"
        transform="matrix(1, 0, 0, 1, -12, -8.41)"
      >
        <path d="m12 24.42v-16.02l11.59 11.62h-6.78l-.41.12z" />
        <path d="m21.08 25.1-3.61 1.54-4.68-11.09 3.69-1.55z" />
      </g>
      <g
        fill="white"
        transform="matrix(1, 0, 0, 1, -12, -8.41)"
      >
        <path d="m12 24.42v-16.02l11.59 11.62h-6.78l-.41.12z" />
        <path d="m21.08 25.1-3.61 1.54-4.68-11.09 3.69-1.55z" />
      </g>
      <g
        fill={fill}
        transform="matrix(1, 0, 0, 1, -12, -8.41)"
      >
        <path d="m19.75 24.42-1.84.77-3.1-7.37 1.84-.78z" />
        <path d="m13 10.81v11.19l2.97-2.87.43-.14h4.77z" />
      </g>
    </svg>
  );
}

/**
 * Presence cursors anchored to scrollable grid content.
 * Re-publishes on scroll so peers stay aligned with the same table cells.
 */
export function GridCursors({ room, userCursorColor, paneRef }) {
  const spaceId = gridCursorSpaceId(room);
  const cursorsPresence = room.usePresence({ keys: [spaceId] });
  const lastClient = useRef(null);
  const inside = useRef(false);
  const publishPresence = cursorsPresence.publishPresence;

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane || !publishPresence) return;

    const sync = () => {
      if (!inside.current || !lastClient.current) return;
      const { clientX, clientY } = lastClient.current;
      const point = contentPointFromPane(pane, clientX, clientY);
      publishPresence({
        [spaceId]: {
          x: point.x,
          y: point.y,
          color: userCursorColor,
        },
      });
    };

    const clear = () => {
      inside.current = false;
      lastClient.current = null;
      publishPresence({ [spaceId]: undefined });
    };

    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      lastClient.current = { clientX: e.clientX, clientY: e.clientY };
      inside.current = true;
      sync();
    };

    const onPointerLeave = (e) => {
      if (pane.contains(e.relatedTarget)) return;
      clear();
    };

    const onScroll = () => sync();

    pane.addEventListener('pointermove', onPointerMove);
    pane.addEventListener('pointerleave', onPointerLeave);
    pane.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      pane.removeEventListener('pointermove', onPointerMove);
      pane.removeEventListener('pointerleave', onPointerLeave);
      pane.removeEventListener('scroll', onScroll);
    };
  }, [paneRef, publishPresence, spaceId, userCursorColor]);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'visible',
        zIndex: 50,
      }}
    >
      {Object.entries(cursorsPresence.peers).map(([id, presence]) => {
        const cursor = presence[spaceId];
        if (!cursor) return null;

        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
              transformOrigin: '0 0',
              transition: 'transform 100ms',
            }}
          >
            <CursorGlyph color={cursor.color} />
          </div>
        );
      })}
    </div>
  );
}
