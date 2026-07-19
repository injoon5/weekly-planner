import { useState } from 'react';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Copy, Eraser, Trash2 } from 'lucide-react';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { UiSelect } from './ui/UiSelect.jsx';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { t } from '../strings.js';

const REPEAT_OPTS = [
  { value: 0, label: t.board.repeatOpts.none },
  { value: 1, label: t.board.repeatOpts.weekly },
  { value: 2, label: t.board.repeatOpts.week2 },
  { value: 3, label: t.board.repeatOpts.week3 },
  { value: 4, label: t.board.repeatOpts.week4 },
];

/** Commit name/dates on blur (or Enter), not on every keystroke.
 *  Parent remounts via `key={board.id}` when the active board changes. */
export function BoardMenu({ board, solo, canEditMeta = true, onCommit, onDup, onClear, onDelete }) {
  const [name, setName] = useState(board.name || '');
  const [from, setFrom] = useState(board.from || '');
  const [to, setTo] = useState(board.to || '');
  const [repeat, setRepeat] = useState(board.repeatEvery || 0);

  const flush = (patch) => {
    if (!canEditMeta) return;
    onCommit(patch);
  };

  return (
    <>
      <div {...stylex.props(menus.pin)}>
        <input
          {...stylex.props(ui.input, ui.inputSm)}
          value={name}
          placeholder={t.board.namePlaceholder}
          aria-label={t.board.namePlaceholder}
          disabled={!canEditMeta}
          onInput={(e) => setName(e.target.value.slice(0, 40))}
          onBlur={() => {
            const next = name.trim().slice(0, 40) || t.app.board;
            setName(next);
            if (next !== (board.name || '')) flush({ name: next });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      </div>

      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>{t.board.startDate}</span>
        <input
          type="date"
          {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
          aria-label={t.board.startDate}
          value={from}
          max={to || undefined}
          disabled={!canEditMeta}
          onInput={(e) => setFrom(e.target.value)}
          onChange={(e) => flush({ from: e.target.value })}
        />
      </div>

      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>{t.board.endDate}</span>
        <input
          type="date"
          {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
          aria-label={t.board.endDate}
          value={to}
          min={from || undefined}
          disabled={!canEditMeta}
          onInput={(e) => setTo(e.target.value)}
          onChange={(e) => flush({ to: e.target.value })}
        />
      </div>

      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>{t.board.repeat}</span>
        <UiSelect
          ariaLabel={t.board.repeat}
          items={REPEAT_OPTS}
          value={repeat}
          disabled={!canEditMeta}
          xstyle={menus.drowInput}
          onValueChange={(v) => {
            setRepeat(v);
            flush({ repeatEvery: v });
          }}
        />
      </div>

      {canEditMeta && (
        <>
          <Separator {...stylex.props(menus.mdiv)} />

          <button type="button" {...stylex.props(menus.mi)} onClick={onDup}>
            <span {...stylex.props(menus.miIconWrap)}>
              <Copy size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>{t.board.duplicate}</span>
          </button>

          <HoldToConfirm
            {...stylex.props(menus.mi, menus.miRed, menus.hold)}
            onConfirm={onClear}
            aria-label={t.a11y.clearEventsHold}
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <Eraser size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>{t.board.clearAll}</span>
          </HoldToConfirm>

          <HoldToConfirm
            {...stylex.props(menus.mi, menus.miRed, menus.hold)}
            disabled={solo}
            title={solo ? t.board.soloBoard : undefined}
            onConfirm={onDelete}
            aria-label={t.a11y.deleteBoardHold}
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <Trash2 size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>{t.board.delete}</span>
          </HoldToConfirm>
        </>
      )}
    </>
  );
}
