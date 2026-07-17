/** Map viewport pointer position to scroll-content coordinates inside a pane. */
export function contentPointFromPane(pane, clientX, clientY) {
  const rect = pane.getBoundingClientRect();
  return {
    x: clientX - rect.left + pane.scrollLeft,
    y: clientY - rect.top + pane.scrollTop,
  };
}

export function gridCursorSpaceId(room) {
  return `grid-cursors--${String(room.type)}-${room.id}`;
}
