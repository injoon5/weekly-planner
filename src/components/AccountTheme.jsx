import * as stylex from '@stylexjs/stylex';
import { account } from '../styles/account.js';
import { UiSelect } from './ui/UiSelect.jsx';
import { Card } from './AccountCard.jsx';

const THEME_OPTS = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

export function ThemeCard({ index, theme, persistTheme }) {
  return (
    <Card index={index}>
      <h2 {...stylex.props(account.cardTitle)}>화면</h2>
      <p {...stylex.props(account.cardHint)}>테마는 이 계정의 모든 기기에 적용돼요.</p>
      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)}>테마</span>
        <div {...stylex.props(account.rowControl)}>
          <UiSelect
            ariaLabel="테마"
            items={THEME_OPTS}
            value={theme === 'dark' ? 'dark' : 'light'}
            xstyle={account.themeSelect}
            onValueChange={(next) => void persistTheme(next)}
          />
        </div>
      </div>
    </Card>
  );
}
