import { useLayoutEffect, useRef, useState } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';
import * as stylex from '@stylexjs/stylex';
import { ListChecks, Plus, X } from 'lucide-react';
import { DAYS_KO } from '../config.js';
import { useMobileSheet } from '../hooks/useMobileSheet.js';
import { todos as s } from '../styles/todos.js';

// Exit is deferred by this long so the row can play its collapse animation
// before it leaves the list. Matches the .26s grid-rows transition + a hair.
const REMOVE_MS = 280;

function subtitle(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dow = DAYS_KO[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 ${dow}요일`;
}

function TodoRow({ todo, index, leaving, onToggle, onRemove }) {
  return (
    <li {...stylex.props(s.rowWrap, leaving && s.rowWrapOut)}>
      <div {...stylex.props(s.rowClip)}>
        <div
          {...stylex.props(s.row, s.rowShowDel)}
          // Cascade on open; a freshly added row plays the same soft entrance.
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
            <span {...stylex.props(s.labelWrap)}>
              <span {...stylex.props(s.label, todo.done && s.labelOn)}>{todo.text}</span>
              <span {...stylex.props(s.strike, todo.done && s.strikeOn)} aria-hidden="true" />
            </span>
          </Checkbox.Root>

          <button
            type="button"
            {...stylex.props(s.del)}
            aria-label="삭제"
            onClick={() => onRemove(todo.id)}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </li>
  );
}

/** Shared panel body — identical on desktop dialog and mobile drawer. */
function PanelBody({ api, TitleTag, CloseTag }) {
  const { todos: items, date, add, toggle, remove } = api;
  const [text, setText] = useState('');
  const [leaving, setLeaving] = useState(() => new Set());
  const inputRef = useRef(null);

  const total = items.length;
  const done = items.reduce((n, t) => n + (t.done ? 1 : 0), 0);
  const progress = total ? done / total : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    add(text);
    setText('');
    // Keep focus so several can be typed in a row.
    inputRef.current?.focus();
  };

  const handleRemove = (id) => {
    setLeaving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      remove(id);
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, REMOVE_MS);
  };

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
        <CloseTag {...stylex.props(s.close)} aria-label="닫기">
          <X size={17} strokeWidth={1.9} />
        </CloseTag>
      </header>

      <div {...stylex.props(s.rail)}>
        <div
          {...stylex.props(s.railFill)}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {total === 0 ? (
        <div {...stylex.props(s.empty)}>
          <span {...stylex.props(s.emptyIcon)} aria-hidden="true">
            <ListChecks size={20} strokeWidth={1.75} />
          </span>
          <span {...stylex.props(s.emptyTitle)}>새로운 하루예요</span>
          <span {...stylex.props(s.emptyHint)}>
            오늘 해야 할 일을 적어보세요. 목록은 자정이 지나면 비워져요.
          </span>
        </div>
      ) : (
        <ScrollArea.Root {...stylex.props(s.scroll)}>
          <ScrollArea.Viewport style={{ height: '100%' }}>
            <ul {...stylex.props(s.list)}>
              {items.map((todo, i) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  index={i}
                  leaving={leaving.has(todo.id)}
                  onToggle={toggle}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-ui-scrollbar="">
            <ScrollArea.Thumb data-ui-scroll-thumb="" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      )}

      <form {...stylex.props(s.foot)} onSubmit={submit}>
        <input
          ref={inputRef}
          {...stylex.props(s.input)}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="할 일 추가"
          enterKeyHint="done"
          maxLength={140}
          aria-label="할 일 추가"
        />
        <button
          type="submit"
          {...stylex.props(s.addBtn)}
          disabled={!text.trim()}
          aria-label="추가"
        >
          <Plus size={18} strokeWidth={2.2} />
        </button>
      </form>
    </>
  );
}

/**
 * Today's to-do list. Slide-in side panel on desktop, swipeable bottom drawer
 * on mobile — mirroring the app's Sheet split, but anchored to the right so it
 * reads as a companion rail rather than a modal.
 *
 * Mounts closed, then opens on layout so Base UI applies its enter transition.
 */
export function TodoPanel({ open, onOpenChange, api }) {
  const mobile = useMobileSheet();
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    setShown(open);
  }, [open]);

  const handleOpenChange = (next) => {
    setShown(next);
    if (!next) onOpenChange(false);
  };

  if (mobile) {
    return (
      <Drawer.Root open={shown} onOpenChange={handleOpenChange} swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-ui-todos-backdrop="" {...stylex.props(s.scrim)} />
          <Drawer.Viewport data-ui-drawer-viewport="">
            <Drawer.Popup data-ui-drawer="" {...stylex.props(s.panel, s.panelMobile)}>
              <Drawer.Content>
                <PanelBody api={api} TitleTag={Drawer.Title} CloseTag={Drawer.Close} />
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog.Root open={shown} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop data-ui-todos-backdrop="" {...stylex.props(s.scrim)} />
        <Dialog.Popup data-ui-todos="" {...stylex.props(s.panel)}>
          <PanelBody api={api} TitleTag={Dialog.Title} CloseTag={Dialog.Close} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
