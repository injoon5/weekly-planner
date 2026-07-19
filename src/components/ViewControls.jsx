import { useState } from 'react';
import { Separator } from '@base-ui/react/separator';
import { Toggle } from '@base-ui/react/toggle';
import * as stylex from '@stylexjs/stylex';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { SwitchRow } from './ui/SwitchRow.jsx';
import { t } from '../strings.js';

function ColorLabelInput({ color, label, onCommit }) {
  const [draft, setDraft] = useState(label);

  const commit = async () => {
    const next = draft.trim().slice(0, 20);
    if (next === label) return;
    const didSave = await onCommit(color, next);
    if (!didSave) setDraft(label);
  };

  return (
    <input
      {...stylex.props(ui.input, ui.inputSm, menus.drowInput, menus.colorLabelInput)}
      value={draft}
      maxLength={20}
      aria-label={t.a11y.colorName(color)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
}

export function ViewControls({ views }) {
  if (!views) return null;

  const hidden = new Set(views.hiddenColors);

  return (
    <>
      <div {...stylex.props(menus.mcap, menus.mcapStrong, menus.mcapFirst)}>{t.view.heading}</div>

      <SwitchRow
        label={t.view.hideWeekend}
        checked={views.hideWeekend}
        onChange={views.setHideWeekend}
      />
      <SwitchRow label={t.view.compact} checked={views.compact} onChange={views.setCompact} />
      <SwitchRow label={t.view.showMemos} checked={views.showMemos} onChange={views.setShowMemos} />

      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>{t.view.colorFilter}</div>

      {views.palette.map((c) => {
        const on = !hidden.has(c);
        return (
          <div key={c} {...stylex.props(menus.drow, menus.colorRow)}>
            <Toggle
              {...stylex.props(menus.swatch)}
              data-color={c}
              pressed={on}
              aria-label={t.a11y.colorToggle(views.colorLabel(c), on)}
              title={on ? t.common.hide : t.common.show}
              onPressedChange={() => views.toggleColor(c)}
            >
              <span {...stylex.props(menus.swatchDot, !on && menus.swatchDotOff)} />
            </Toggle>
            {views.canRenameColors ? (
              <ColorLabelInput
                key={`${c}:${views.colorLabel(c)}`}
                color={c}
                label={views.colorLabel(c)}
                onCommit={views.setColorLabel}
              />
            ) : (
              <span {...stylex.props(menus.miLabel, menus.colorLabelText)}>
                {views.colorLabel(c)}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
