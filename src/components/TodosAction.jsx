import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { ListChecks } from 'lucide-react';
import { useTodayTodos } from '../hooks/useTodayTodos.js';
import { planner } from '../styles/planner.js';
import { todos as todoStyles } from '../styles/todos.js';
import { TodoPanel } from './TodoPanel.jsx';
import { t } from '../strings.js';

/**
 * Header trigger for today's to-do panel; the badge counts what's left.
 * The panel itself renders through a portal, so both live here together.
 */
export function TodosAction({ user, events }) {
  const [open, setOpen] = useState(false);
  const api = useTodayTodos(user, events);
  const remaining = api.todos.reduce((n, t) => n + (t.done ? 0 : 1), 0);

  return (
    <>
      <button
        {...stylex.props(planner.ibtn, todoStyles.trigger)}
        type="button"
        aria-label={t.a11y.todayTodos}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <ListChecks size={15} strokeWidth={1.75} />
        {remaining > 0 && (
          <span {...stylex.props(todoStyles.badge)} aria-hidden="true">
            {remaining > 9 ? '9+' : remaining}
          </span>
        )}
      </button>
      <TodoPanel open={open} onOpenChange={setOpen} api={api} />
    </>
  );
}
