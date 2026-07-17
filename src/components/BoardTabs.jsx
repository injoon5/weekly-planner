import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Plus, ChevronDown } from 'lucide-react';
import { planner } from '../styles/planner.js';

/**
 * Board tab strip with a sliding active pill.
 */
export function BoardTabs({ boards, activeId, canAdd, onSelect, onOpenActive, onAdd }) {
  const rowRef = useRef(null);
  const btnRefs = useRef(new Map());
  const [pill, setPill] = useState({ x: 0, w: 0, ready: false });
  const [fade, setFade] = useState({ left: false, right: false });
  const first = useRef(true);

  // The scrollbar is hidden, so fade the clipped edge instead — otherwise
  // overflowing tabs on small screens just look cut off / missing.
  const updateFade = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  }, []);

  // Pill coordinates live in the strip's content space, so they survive
  // scrolling untouched — only tab/size changes need a re-measure. Keeping
  // scrollIntoView out of the scroll path matters: snapping the active tab
  // back into view while the user swipes the strip would fight their scroll.
  const measure = useCallback(() => {
    const row = rowRef.current;
    const btn = btnRefs.current.get(activeId);
    if (!row || !btn) return;
    const rr = row.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPill({
      x: br.left - rr.left + row.scrollLeft,
      w: br.width,
      ready: !first.current,
    });
    first.current = false;
  }, [activeId]);

  useLayoutEffect(() => {
    measure();
    updateFade();
  }, [activeId, boards, measure, updateFade]);

  useEffect(() => {
    const btn = btnRefs.current.get(activeId);
    btn?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(() => {
      measure();
      updateFade();
    });
    ro.observe(row);
    return () => ro.disconnect();
  }, [activeId, boards, measure, updateFade]);

  // Plain vertical wheel scrolls the strip sideways (narrow desktop windows
  // have no other pointer affordance for it). Trackpads already send deltaX.
  const onWheel = (e) => {
    const el = rowRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    el.scrollLeft += e.deltaY;
  };

  return (
    <nav
      {...stylex.props(
        planner.tabs,
        fade.left && fade.right
          ? planner.tabsFadeBoth
          : fade.left
            ? planner.tabsFadeLeft
            : fade.right
              ? planner.tabsFadeRight
              : null,
      )}
      aria-label="시간표 목록"
      ref={rowRef}
      onScroll={updateFade}
      onWheel={onWheel}
    >
      <span
        {...stylex.props(planner.tabPill, pill.ready && planner.tabPillReady)}
        aria-hidden
        style={{
          transform: `translateX(${pill.x}px)`,
          width: pill.w || 0,
        }}
      />
      {boards.map((b) => (
        <button
          key={b.id}
          ref={(el) => {
            if (el) btnRefs.current.set(b.id, el);
            else btnRefs.current.delete(b.id);
          }}
          {...stylex.props(planner.tab, b.id === activeId && planner.tabOn)}
          data-active-tab={b.id === activeId ? 'true' : undefined}
          aria-current={b.id === activeId ? 'true' : 'false'}
          title={b.id === activeId ? '시간표 설정' : b.name}
          onClick={(e) => (b.id === activeId ? onOpenActive(e) : onSelect(b.id))}
        >
          <span {...stylex.props(planner.tabName)}>{b.name || '시간표'}</span>
          {b.id === activeId && <ChevronDown size={11} strokeWidth={2} />}
        </button>
      ))}
      {canAdd && (
        <button {...stylex.props(planner.tadd)} aria-label="새 시간표 추가" onClick={onAdd}>
          <Plus size={13} strokeWidth={2} />
        </button>
      )}
    </nav>
  );
}
