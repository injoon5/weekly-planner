import { useEffect, useMemo, useState } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import * as stylex from '@stylexjs/stylex';
import { ListTodo, Plus, Trash2, X } from 'lucide-react';
import { DAYS_KO } from '../config.js';
import { useMobileSheet } from '../hooks/useMobileSheet.js';
import { checklist } from '../styles/checklist.js';
import { editor } from '../styles/editor.js';
import { planner } from '../styles/planner.js';
import { fmt } from '../time.js';
import { Sheet } from './ui/Sheet.jsx';

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="m3.2 8.2 3.2 3.2 6.4-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChecklistCheckbox({ checked, disabled, onCheckedChange, label }) {
  return (
    <Checkbox.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={(state) =>
        stylex.props(
          checklist.check,
          state.checked && checklist.checkOn,
          disabled && checklist.checkDisabled,
        ).className
      }
    >
      <Checkbox.Indicator
        keepMounted
        className={(state) =>
          stylex.props(
            checklist.checkIndicator,
            state.checked ? checklist.checkIndicatorShown : checklist.checkIndicatorHidden,
          ).className
        }
      >
        <CheckIcon />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

function ChecklistBody({
  day,
  onDayChange,
  todayDow,
  dayEvents,
  dayTodos,
  canEdit,
  onToggleEvent,
  onToggleTodo,
  onAddTodo,
  onRemoveTodo,
  titleId,
  onClose,
  showClose,
}) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft('');
  }, [day]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || !canEdit) return;
    setDraft('');
    await onAddTodo(text);
  };

  return (
    <>
      <div {...stylex.props(checklist.head)}>
        <h2 id={titleId} {...stylex.props(checklist.title)}>
          할 일
        </h2>
        {showClose && (
          <button
            type="button"
            {...stylex.props(checklist.close)}
            aria-label="닫기"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div {...stylex.props(checklist.days)} role="tablist" aria-label="요일">
        {DAYS_KO.map((label, d) => {
          const selected = d === day;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={selected}
              {...stylex.props(
                checklist.dayBtn,
                selected && checklist.dayBtnOn,
                d === todayDow && !selected && checklist.dayBtnToday,
              )}
              onClick={() => onDayChange(d)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div {...stylex.props(checklist.scroll)}>
        <section {...stylex.props(checklist.section)} aria-label="시간표">
          <h3 {...stylex.props(checklist.sectionLabel)}>시간표</h3>
          {dayEvents.length === 0 ? (
            <p {...stylex.props(checklist.empty)}>이 요일에 일정이 없어요</p>
          ) : (
            <ul {...stylex.props(checklist.list)}>
              {dayEvents.map((ev, i) => (
                <li
                  key={ev.id}
                  {...stylex.props(checklist.row, canEdit && checklist.rowInteractive)}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <ChecklistCheckbox
                    checked={Boolean(ev.done)}
                    disabled={!canEdit}
                    label={`${ev.title || '일정'} 완료`}
                    onCheckedChange={(next) => onToggleEvent(ev.id, next)}
                  />
                  <div {...stylex.props(checklist.rowBody)}>
                    <span
                      {...stylex.props(
                        checklist.rowTitle,
                        ev.done && checklist.rowTitleDone,
                      )}
                    >
                      {ev.title || '일정'}
                    </span>
                    <span {...stylex.props(checklist.rowMeta)}>
                      {fmt(ev.start)} – {fmt(ev.start + ev.dur)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section {...stylex.props(checklist.section)} aria-label="할 일">
          <h3 {...stylex.props(checklist.sectionLabel)}>할 일</h3>
          {dayTodos.length === 0 && !canEdit ? (
            <p {...stylex.props(checklist.empty)}>할 일이 없어요</p>
          ) : (
            <ul {...stylex.props(checklist.list)}>
              {dayTodos.map((todo, i) => (
                <li
                  key={todo.id}
                  {...stylex.props(checklist.row, canEdit && checklist.rowInteractive)}
                  style={{
                    animationDelay: `${Math.min(dayEvents.length + i, 12) * 40}ms`,
                  }}
                  data-checklist-row=""
                >
                  <ChecklistCheckbox
                    checked={Boolean(todo.done)}
                    disabled={!canEdit}
                    label={`${todo.text} 완료`}
                    onCheckedChange={(next) => onToggleTodo(todo.id, next)}
                  />
                  <div {...stylex.props(checklist.rowBody)}>
                    <span
                      {...stylex.props(
                        checklist.rowTitle,
                        todo.done && checklist.rowTitleDone,
                      )}
                    >
                      {todo.text}
                    </span>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      {...stylex.props(checklist.deleteBtn)}
                      data-checklist-delete=""
                      aria-label="삭제"
                      onClick={() => onRemoveTodo(todo.id)}
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <form
              {...stylex.props(checklist.addRow)}
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <input
                {...stylex.props(checklist.addInput)}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="할 일 추가"
                maxLength={120}
                aria-label="할 일 추가"
              />
              <button
                type="submit"
                {...stylex.props(checklist.addBtn)}
                disabled={!draft.trim()}
                aria-label="추가"
              >
                <Plus size={15} strokeWidth={2} />
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}

/**
 * Optional day checklist: desktop side rail (no scrim), mobile bottom Sheet.
 */
export function DayChecklist({
  open,
  onOpenChange,
  events,
  todos,
  todayDow,
  canEdit,
  todosApi,
}) {
  const mobile = useMobileSheet();
  const [day, setDay] = useState(todayDow);

  useEffect(() => {
    if (open) setDay(todayDow);
  }, [open, todayDow]);

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.day === day)
        .sort((a, b) => a.start - b.start || a.dur - b.dur),
    [events, day],
  );

  const dayTodos = useMemo(
    () => todos.filter((t) => t.day === day),
    [todos, day],
  );

  const bodyProps = {
    day,
    onDayChange: setDay,
    todayDow,
    dayEvents,
    dayTodos,
    canEdit,
    onToggleEvent: (id, done) => todosApi.toggleEventDone(id, done),
    onToggleTodo: (id, done) => todosApi.toggleTodoDone(id, done),
    onAddTodo: (text) =>
      todosApi.addTodo({
        day,
        text,
        sortOrder: Date.now(),
      }),
    onRemoveTodo: (id) => todosApi.removeTodo(id),
    onClose: () => onOpenChange(false),
  };

  if (mobile) {
    return (
      <Sheet.Root open={open} onOpenChange={onOpenChange}>
        <Sheet.Portal>
          <Sheet.Backdrop {...stylex.props(editor.scrim)} />
          <Sheet.Viewport>
            <Sheet.Popup {...stylex.props(editor.dlg)}>
              <ChecklistBody
                {...bodyProps}
                titleId="day-checklist-title"
                showClose
              />
            </Sheet.Popup>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    );
  }

  return (
    <aside
      {...stylex.props(checklist.rail, !open && checklist.railClosed)}
      aria-hidden={!open}
      aria-label="할 일"
    >
      <ChecklistBody {...bodyProps} titleId="day-checklist-title-rail" showClose />
    </aside>
  );
}

export function ChecklistToggle({ open, onClick }) {
  return (
    <button
      type="button"
      {...stylex.props(planner.ibtn, open && planner.ibtnOn)}
      aria-label={open ? '할 일 닫기' : '할 일 열기'}
      aria-pressed={open}
      onClick={onClick}
      title="할 일"
    >
      <ListTodo size={15} strokeWidth={open ? 2 : 1.75} />
    </button>
  );
}
