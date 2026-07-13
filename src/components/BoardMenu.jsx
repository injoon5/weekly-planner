import { useState, useEffect } from 'react';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Copy, Eraser, Trash2 } from 'lucide-react';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { UiSelect } from './ui/UiSelect.jsx';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';

const REPEAT_OPTS = [
  { value: 0, label: '반복 안 함' },
  { value: 1, label: '매주' },
  { value: 2, label: '2주마다' },
  { value: 3, label: '3주마다' },
  { value: 4, label: '4주마다' },
];

/** Commit name/dates on blur (or Enter), not on every keystroke. */
export function BoardMenu({ board, solo, canEditMeta = true, onCommit, onDup, onClear, onDelete }) {
  const [name, setName] = useState(board.name || '');
  const [from, setFrom] = useState(board.from || '');
  const [to, setTo] = useState(board.to || '');
  const [repeat, setRepeat] = useState(board.repeatEvery || 0);

  useEffect(() => {
    setName(board.name || '');
    setFrom(board.from || '');
    setTo(board.to || '');
    setRepeat(board.repeatEvery || 0);
  }, [board.id, board.name, board.from, board.to, board.repeatEvery]);

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
          placeholder="시간표 이름"
          aria-label="시간표 이름"
          disabled={!canEditMeta}
          onInput={(e) => setName(e.target.value.slice(0, 40))}
          onBlur={() => {
            const next = name.trim().slice(0, 40) || '시간표';
            setName(next);
            if (next !== (board.name || '')) flush({ name: next });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      </div>

      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>시작일</span>
        <input
          type="date"
          {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
          aria-label="시작일"
          value={from}
          max={to || undefined}
          disabled={!canEditMeta}
          onInput={(e) => setFrom(e.target.value)}
          onChange={(e) => flush({ from: e.target.value })}
        />
      </div>

      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>종료일</span>
        <input
          type="date"
          {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
          aria-label="종료일"
          value={to}
          min={from || undefined}
          disabled={!canEditMeta}
          onInput={(e) => setTo(e.target.value)}
          onChange={(e) => flush({ to: e.target.value })}
        />
      </div>

      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>반복</span>
        <UiSelect
          ariaLabel="반복"
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
            <span {...stylex.props(menus.miLabel)}>복제</span>
          </button>

          <HoldToConfirm
            {...stylex.props(menus.mi, menus.miRed, menus.hold)}
            onConfirm={onClear}
            aria-label="모든 일정 비우기 — 길게 눌러 확인"
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <Eraser size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>모든 일정 비우기</span>
          </HoldToConfirm>

          <HoldToConfirm
            {...stylex.props(menus.mi, menus.miRed, menus.hold)}
            disabled={solo}
            title={solo ? '시간표가 하나뿐이에요' : undefined}
            onConfirm={onDelete}
            aria-label="시간표 삭제 — 길게 눌러 확인"
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <Trash2 size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>시간표 삭제</span>
          </HoldToConfirm>
        </>
      )}
    </>
  );
}
