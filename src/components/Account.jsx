import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, LogOut, UserPlus } from 'lucide-react';
import { db, id } from '../db/instant.js';
import { commitTransaction } from '../db/transaction.js';
import { useTheme } from '../hooks/useTheme.js';
import { account } from '../styles/account.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { toast } from './ui/toast.js';
import { UpgradeDialog } from './UpgradeDialog.jsx';
import { Card } from './AccountCard.jsx';
import { ProfileCard } from './AccountProfile.jsx';
import { ThemeCard } from './AccountTheme.jsx';
import { TokensCard } from './AccountTokens.jsx';

export function Account() {
  const auth = db.useAuth();
  const navigate = useNavigate();
  const user = auth.user;
  const isGuest = Boolean(user?.isGuest);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data, isLoading, error } = db.useQuery(user ? { settings: {} } : null);
  const settings = data?.settings?.[0] || null;
  const { theme, persistTheme } = useTheme(settings);

  if (!user) {
    if (auth.isLoading) {
      return (
        <div {...stylex.props(planner.boot)} role="status" aria-live="polite">
          <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
          불러오는 중…
        </div>
      );
    }
    return null;
  }
  if (error) {
    return (
      <div {...stylex.props(planner.boot)} role="alert">
        오류: {error.message}
      </div>
    );
  }

  const saveSettings = async (patch, message) => {
    const tx = settings?.id
      ? db.tx.settings[settings.id].update(patch)
      : db.tx.settings[id()].update({ theme, ...patch }).link({ owner: user.id });
    const result = await commitTransaction((t) => db.transact(t), tx, {
      message: '저장하지 못했어요',
      onError: toast,
    });
    if (result.ok && message) toast(message);
    return result;
  };

  return (
    <div {...stylex.props(account.root)}>
      <div {...stylex.props(account.shell)}>
        <div {...stylex.props(account.topRow)}>
          <button
            type="button"
            {...stylex.props(planner.ibtn)}
            aria-label="시간표로 돌아가기"
            onClick={() => void navigate({ to: '/' })}
          >
            <ArrowLeft size={15} strokeWidth={1.75} />
          </button>
          <h1 {...stylex.props(account.title)}>계정 설정</h1>
        </div>

        {isLoading ? (
          <div {...stylex.props(planner.boot)} role="status" aria-live="polite">
            <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
            불러오는 중…
          </div>
        ) : (
          <>
            <ProfileCard index={0} user={user} settings={settings} saveSettings={saveSettings} />
            <ThemeCard index={1} theme={theme} persistTheme={persistTheme} />

            {isGuest ? (
              <Card index={2}>
                <h2 {...stylex.props(account.cardTitle)}>API 토큰</h2>
                <p {...stylex.props(account.cardHint)}>
                  게스트 모드에서는 API 토큰을 만들 수 없어요. 계정을 만들면 데이터가 저장되고 REST
                  API도 쓸 수 있어요.
                </p>
                <button
                  type="button"
                  {...stylex.props(ui.btn, ui.btnPrimary)}
                  onClick={() => setUpgradeOpen(true)}
                >
                  <UserPlus size={14} strokeWidth={1.75} />
                  계정 만들기
                </button>
              </Card>
            ) : (
              <TokensCard index={2} refreshToken={user.refresh_token} />
            )}

            <Card index={3}>
              <div {...stylex.props(account.dangerZone)}>
                <div>
                  <h2 {...stylex.props(account.cardTitle)}>로그아웃</h2>
                  <p {...stylex.props(account.cardHint, account.cardHintTight)}>
                    이 기기에서 로그아웃해요.
                  </p>
                </div>
                <button
                  type="button"
                  {...stylex.props(ui.btn, ui.btnPlain, account.rowBtn)}
                  onClick={() => void db.auth.signOut()}
                >
                  <LogOut size={14} strokeWidth={1.75} />
                  로그아웃
                </button>
              </div>
            </Card>
          </>
        )}
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
