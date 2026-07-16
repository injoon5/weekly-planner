import { useLayoutEffect, useState } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';
import * as stylex from '@stylexjs/stylex';
import { CalendarClock, X } from 'lucide-react';
import { DAYS_KO } from '../config.js';
import { useMobileSheet } from '../hooks/useMobileSheet.js';
import { todos as s } from '../styles/todos.js';

function subtitle(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dow = DAYS_KO[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 ${dow}요일`;
}

function TodoRow({ todo, index, onToggle }) {
  return (
    <li {...stylex.props(s.rowClip)}>
      <div
        {...stylex.props(s.row)}
        // Cascade on open; a soft entrance per row.
        style={{ animationDelay: `${Math.min(index, 10) * 24}ms` }}
      >
        <Checkbox.Root
          checked={todo.done}
          onCheckedChange={() => onToggle(todo.id)}
          {...stylex.props(s.toggle)}
        >
          <span {...stylex.props(s.box, todo.done && s.boxOn)} aria-hidden="true">
            <svg viewBox="0 0 14 14" {...stylex.props(s.check, todo.done && s.checkOn)}>
              <path d="M2.5 7.5 L5.75 10.5 L11.5 3.75" />
            </svg>
          </span>
          <span {...stylex.props(s.rowText)}>
            <span {...stylex.props(s.time, todo.done && s.timeOn)}>{todo.time}</span>
            <span {...stylex.props(s.labelWrap)}>
              <span {...stylex.props(s.label, todo.done && s.labelOn)}>
                {todo.text || '제목 없음'}
              </span>
              <span {...stylex.props(s.strike, todo.done && s.strikeOn)} aria-hidden="true" />
            </span>
          </span>
        </Checkbox.Root>
      </div>
    </li>
  );
}

/** Shared panel body — identical on desktop panel and mobile drawer. */
function PanelBody({ api, TitleTag, onClose }) {
  const { todos: items, date, toggle } = api;

  const total = items.length;
  const done = items.reduce((n, t) => n + (t.done ? 1 : 0), 0);
  const progress = total ? done / total : 0;

  return (
    <>
      <span {...stylex.props(s.grip)} aria-hidden="true" />

      <header {...stylex.props(s.head)}>
        <div {...stylex.props(s.headText)}>
          <TitleTag {...stylex.props(s.title)}>오늘 할 일</TitleTag>
          <span {...stylex.props(s.sub)}>
            {subtitle(date)}
            {total > 0 && ` · ${done}/${total} 완료`}
          </span>
        </div>
        <button type="button" onClick={onClose} {...stylex.props(s.close)} aria-label="닫기">
          <X size={17} strokeWidth={1.9} />
        </button>
      </header>

      <div {...stylex.props(s.rail)}>
        <div {...stylex.props(s.railFill)} style={{ transform: `scaleX(${progress})` }} />
      </div>

      {total === 0 ? (
        <div {...stylex.props(s.empty)}>
          <span {...stylex.props(s.emptyIcon)} aria-hidden="true">
            <CalendarClock size={20} strokeWidth={1.75} />
          </span>
          <span {...stylex.props(s.emptyTitle)}>오늘 일정이 없어요</span>
          <span {...stylex.props(s.emptyHint)}>
            시간표에 오늘 일정을 추가하면 여기에서 하나씩 체크할 수 있어요.
          </span>
        </div>
      ) : (
        <ScrollArea.Root {...stylex.props(s.scroll)}>
          <ScrollArea.Viewport style={{ height: '100%' }}>
            <ul {...stylex.props(s.list)}>
              {items.map((todo, i) => (
                <TodoRow key={todo.id} todo={todo} index={i} onToggle={toggle} />
              ))}
            </ul>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-ui-scrollbar="">
            <ScrollArea.Thumb data-ui-scroll-thumb="" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      )}
    </>
  );
}

/**
 * Today's to-do list — live read-through of the active schedule's events for
 * today. Desktop: floating side panel without a scrim so the grid stays
 * editable and the list updates in place. Mobile: swipeable bottom drawer.
 */
export function TodoPanel({ open, onOpenChange, api }) {
  const mobile = useMobileSheet();
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    if (mobile) setShown(open);
  }, [open, mobile]);

  const close = () => onOpenChange(false);

  if (mobile) {
    const handleOpenChange = (next) => {
      setShown(next);
      if (!next) onOpenChange(false);
    };

    return (
      <Drawer.Root open={shown} onOpenChange={handleOpenChange} swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-ui-todos-backdrop="" {...stylex.props(s.scrim)} />
          <Drawer.Viewport data-ui-drawer-viewport="">
            <Drawer.Popup data-ui-drawer="" {...stylex.props(s.panel, s.panelMobile)}>
              <Drawer.Content {...stylex.props(s.content)}>
                <PanelBody api={api} TitleTag={Drawer.Title} onClose={close} />
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: same floating chrome as before, but no Dialog/scrim — always
  // mounted so schedule edits re-render into the open list.
  return (
    <aside
      data-ui-todos=""
      {...stylex.props(s.panel)}
      aria-hidden={!open}
      aria-label="오늘 할 일"
    >
      <PanelBody api={api} TitleTag="h2" onClose={close} />
    </aside>
  );
}
