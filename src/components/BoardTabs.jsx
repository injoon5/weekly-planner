import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const first = useRef(true);

  // Pill coordinates live in the strip's content space, so they survive
  // scrolling untouched — only tab/size changes need a re-measure. Keeping
  // scrollIntoView out of the scroll path matters: snapping the active tab
  // back into view while the user swipes the strip would fight their scroll.
  const measure = () => {
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
  };

  useLayoutEffect(() => {
    measure();
  }, [activeId, boards]);

  useEffect(() => {
    const btn = btnRefs.current.get(activeId);
    btn?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(row);
    return () => ro.disconnect();
  }, [activeId, boards]);

  return (
    <nav {...stylex.props(planner.tabs)} aria-label="시간표 목록" ref={rowRef}>
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
