import { useLayoutEffect, useState } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { ScrollArea } from '@base-ui/react/scroll-area';
import * as stylex from '@stylexjs/stylex';
import { CalendarClock, X } from 'lucide-react';
import { DAYS_KO } from '../lib/config.js';
import { todos as s } from '../styles/todos.js';
import { Sheet } from './ui/sheet.js';

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

function PanelBody({ api }) {
  const { todos: items, date, toggle } = api;

  const total = items.length;
  const done = items.reduce((n, t) => n + (t.done ? 1 : 0), 0);
  const progress = total ? done / total : 0;

  return (
    <>
      <header {...stylex.props(s.head)}>
        <div {...stylex.props(s.headText)}>
          <Sheet.Title {...stylex.props(s.title)}>오늘 할 일</Sheet.Title>
          <span {...stylex.props(s.sub)}>
            {subtitle(date)}
            {total > 0 && ` · ${done}/${total} 완료`}
          </span>
        </div>
        <Sheet.Close {...stylex.props(s.close)} aria-label="닫기">
          <X size={17} strokeWidth={1.9} />
        </Sheet.Close>
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
 * Today's to-do list via the shared Sheet shell (drawer on mobile, dialog on desktop).
 * Mounts closed, then opens on layout so Base UI applies its enter transition.
 */
export function TodoPanel({ open, onOpenChange, api }) {
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    setShown(open);
  }, [open]);

  return (
    <Sheet.Root
      variant="rail"
      open={shown}
      onOpenChange={(next) => {
        setShown(next);
        if (!next) onOpenChange(false);
      }}
    >
      <Sheet.Portal>
        <Sheet.Backdrop {...stylex.props(s.scrim)} />
        <Sheet.Viewport>
          <Sheet.Popup {...stylex.props(s.panel, s.panelMobile)}>
            <div {...stylex.props(s.content)}>
              <PanelBody api={api} />
            </div>
          </Sheet.Popup>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
