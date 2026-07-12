import * as stylex from '@stylexjs/stylex';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';

export function ViewControls({ views }) {
  if (!views) return null;

  return (
    <>
      <div {...stylex.props(menus.mcap)} style={{ paddingTop: 6 }}>
        보기
      </div>

      <label {...stylex.props(menus.mi)} style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={views.hideWeekend}
          onChange={(e) => views.setHideWeekend(e.target.checked)}
        />
        <span {...stylex.props(menus.miLabel)}>주말 숨기기</span>
      </label>

      <label {...stylex.props(menus.mi)} style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={views.compact}
          onChange={(e) => views.setCompact(e.target.checked)}
        />
        <span {...stylex.props(menus.miLabel)}>촘촘하게</span>
      </label>

      <label {...stylex.props(menus.mi)} style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={views.showMemos}
          onChange={(e) => views.setShowMemos(e.target.checked)}
        />
        <span {...stylex.props(menus.miLabel)}>메모 표시</span>
      </label>

      <div {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap)}>색상 필터 · 이름</div>

      {views.palette.map((c) => {
        const on = !views.hiddenColors.includes(c);
        return (
          <div key={c} {...stylex.props(menus.drow)} style={{ gap: 6 }}>
            <button
              type="button"
              aria-pressed={on}
              title={on ? '숨기기' : '보이기'}
              onClick={() => views.toggleColor(c)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 99,
                border: on ? 'none' : '1.5px dashed currentColor',
                opacity: on ? 1 : 0.35,
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              data-color={c}
            >
              <span
                data-color={c}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  borderRadius: 99,
                  background: 'var(--ev-accent)',
                }}
              />
            </button>
            {views.canRenameColors ? (
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={views.colorLabel(c)}
                maxLength={20}
                aria-label={`${c} 이름`}
                onChange={(e) => views.setColorLabel(c, e.target.value)}
              />
            ) : (
              <span {...stylex.props(menus.miLabel)}>{views.colorLabel(c)}</span>
            )}
          </div>
        );
      })}
    </>
  );
}
