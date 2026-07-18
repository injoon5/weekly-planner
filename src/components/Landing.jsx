import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import * as stylex from '@stylexjs/stylex';
import {
  ArrowRight,
  CalendarRange,
  Moon,
  Printer,
  Share2,
  Sun,
  Tags,
  Users,
  WifiOff,
} from 'lucide-react';
import { db } from '../db/instant.js';
import { applyDocumentTheme, readBootTheme } from '../theme/theme-dom.js';
import { landing } from '../styles/landing.js';
import { ui } from '../styles/ui.js';
import { useLandingPresence } from '../hooks/useLandingPresence.js';
import { IconSwap } from './ui/IconSwap.jsx';
import { PresenceAvatars } from './PresenceAvatars.jsx';
import { toast } from './ui/toast.js';

/** Pre-auth theme toggle — no Instant settings yet, so we drive the DOM + cache
 *  directly. `useTheme` takes over once the user is signed in. */
function useLocalTheme() {
  const [theme, setTheme] = useState(readBootTheme);
  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyDocumentTheme(next);
    try {
      localStorage.setItem('weekly-planner.theme', next);
    } catch {
      // Private mode / storage disabled — theme still applies for this session.
    }
  }, [theme]);
  return { theme, toggle };
}

const BrandMark = ({ large }) => (
  <span {...stylex.props(landing.mark, large && landing.markLg)} aria-hidden="true">
    <i {...stylex.props(ui.markA)} />
    <i {...stylex.props(ui.markB)} />
  </span>
);

const FEATURES = [
  {
    icon: Users,
    title: '실시간 협업',
    body: '같은 시간표를 여럿이 함께 편집해요. 커서와 접속 중인 사람이 바로 보이고, 모든 변경이 즉시 동기화됩니다.',
  },
  {
    icon: Tags,
    title: '색상 라벨',
    body: '일정마다 색을 지정하고 이름을 붙여 분류하세요. 한 주의 균형이 색으로 한눈에 들어와요.',
  },
  {
    icon: Share2,
    title: '링크 공유',
    body: '보기 전용 또는 편집 링크를 만들어 공유하고, 비밀번호로 보호할 수 있어요.',
  },
  {
    icon: Printer,
    title: '인쇄 · PDF',
    body: '화면 그대로 깔끔하게 인쇄되도록 다듬었어요. 벽에 붙일 한 장짜리 시간표로 바로 출력하세요.',
  },
  {
    icon: WifiOff,
    title: '오프라인 지원',
    body: '연결이 끊겨도 계속 쓸 수 있어요. 다시 온라인이 되면 변경 사항이 알아서 동기화됩니다.',
  },
  {
    icon: CalendarRange,
    title: '유연한 기간',
    body: '특정 주의 날짜부터 반복되는 주간표까지. 여러 개의 보드로 학기, 프로젝트, 일상을 나눠 관리해요.',
  },
];

// A mini of the real planner grid — same weekday rail, today pill, hour lines,
// event blocks and now-line the app uses. Laid out over a 09:00–18:00 window.
const DAYS = [
  ['월', 'Mon'],
  ['화', 'Tue'],
  ['수', 'Wed'],
  ['목', 'Thu'],
  ['금', 'Fri'],
];
const PXPM = 270 / 540; // px per minute over the 9-hour window
/** Demo now-line vertical band (minutes from 09:00) — mid-day, not near edges. */
const NOW_MIN = 120; // 11:00
const NOW_MAX = 390; // 15:30
const PREVIEW_BLOCKS = [
  { day: 0, start: 60, dur: 90, color: 'coral', title: '디자인 리뷰', time: '10:00' },
  { day: 0, start: 360, dur: 90, color: 'green', title: '운동', time: '15:00' },
  { day: 1, start: 120, dur: 75, color: 'sky', title: '1:1 미팅', time: '11:00' },
  { day: 2, start: 30, dur: 150, color: 'violet', title: '집중 작업', time: '09:30' },
  { day: 3, start: 210, dur: 90, color: 'amber', title: '점심 약속', time: '12:30' },
  { day: 4, start: 0, dur: 45, color: 'pink', title: '스탠드업', time: '09:00' },
  { day: 4, start: 405, dur: 90, color: 'teal', title: '주간 회고', time: '15:45' },
];

/** Mon–Fri preview column for today; null on Sat/Sun (no weekend columns). */
function previewTodayCol(date = new Date()) {
  const jsDay = date.getDay(); // 0=Sun … 6=Sat
  return jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : null;
}

/** Random minutes-from-09:00 for the demo now-line, clamped to a mid-grid band. */
function previewNowStart(rand = Math.random) {
  return NOW_MIN + Math.floor(rand() * (NOW_MAX - NOW_MIN + 1));
}

function PlannerPreview() {
  const todayCol = previewTodayCol();
  const [nowStart] = useState(previewNowStart);
  return (
    <div {...stylex.props(landing.preview)} role="img" aria-label="주간 시간표 미리보기">
      <div {...stylex.props(landing.pHead)}>
        <div {...stylex.props(landing.pCorner)}>시간</div>
        {DAYS.map(([ko, en], col) => (
          <div key={ko} {...stylex.props(landing.pDay)}>
            <span {...stylex.props(landing.pDko, col === todayCol && landing.pToday)}>
              {ko}
            </span>
            <span {...stylex.props(landing.pDen)}>{en}</span>
          </div>
        ))}
      </div>
      <div {...stylex.props(landing.pBody)}>
        <div {...stylex.props(landing.pGut)}>
          {[10, 12, 14, 16].map((h) => (
            <span
              key={h}
              {...stylex.props(landing.pTime)}
              style={{ top: `${(h - 9) * 60 * PXPM}px` }}
            >
              {h}
            </span>
          ))}
        </div>
        {DAYS.map(([ko], col) => (
          <div key={ko} {...stylex.props(landing.pCol)}>
            {[10, 11, 12, 13, 14, 15, 16, 17].map((h) => (
              <i
                key={h}
                {...stylex.props(landing.pLine)}
                style={{ top: `${(h - 9) * 60 * PXPM}px` }}
              />
            ))}
            {PREVIEW_BLOCKS.filter((b) => b.day === col).map((b) => (
              <div
                key={`${b.day}-${b.start}-${b.title}`}
                data-color={b.color}
                {...stylex.props(landing.pBlock)}
                style={{ top: `${b.start * PXPM}px`, height: `${b.dur * PXPM}px` }}
              >
                <div {...stylex.props(landing.pBt)}>{b.title}</div>
                {b.dur >= 60 && <div {...stylex.props(landing.pBm)}>{b.time}</div>}
              </div>
            ))}
            {col === todayCol && (
              <div {...stylex.props(landing.pNow)} style={{ top: `${nowStart * PXPM}px` }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestButton({
  variant = 'primary',
  label = '게스트로 시작하기',
  style,
  onSignedIn,
  showArrow = true,
}) {
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await db.auth.signInAsGuest();
      // On `/` auth flips into Planner; on `/home` (and similar) navigate in.
      onSignedIn?.();
    } catch (ex) {
      setBusy(false);
      toast(ex?.body?.message || ex?.message || '시작하지 못했어요. 다시 시도해 주세요');
    }
  };

  return (
    <button
      type="button"
      onClick={start}
      disabled={busy}
      aria-busy={busy}
      style={style}
      {...stylex.props(
        landing.btn,
        variant === 'primary' ? landing.btnPrimary : landing.btnGhost,
      )}
    >
      {busy ? (
        <>
          <span {...stylex.props(landing.spinner)} aria-hidden="true" />
          시작하는 중…
        </>
      ) : (
        <>
          {label}
          {showArrow ? (
            <ArrowRight size={17} strokeWidth={2} {...stylex.props(landing.btnArrow)} />
          ) : null}
        </>
      )}
    </button>
  );
}

function OpenPlannerButton({ variant = 'primary', label = '시간표 열기', style, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      {...stylex.props(
        landing.btn,
        variant === 'primary' ? landing.btnPrimary : landing.btnGhost,
      )}
    >
      {label}
      <ArrowRight size={17} strokeWidth={2} {...stylex.props(landing.btnArrow)} />
    </button>
  );
}

const STEPS = [
  { title: '게스트로 시작', body: '이메일도, 비밀번호도 없이 버튼 한 번으로 바로 들어와요.' },
  { title: '자유롭게 사용', body: '시간표를 만들고, 편집하고, 공유해 보세요. 전부 실제로 저장돼요.' },
  { title: '이메일로 저장', body: '마음에 들면 이메일을 연결하세요. 만든 데이터는 그대로 이어집니다.' },
];

export function Landing() {
  const navigate = useNavigate();
  const auth = db.useAuth();
  const signedIn = Boolean(auth.user);
  const { theme, toggle } = useLocalTheme();
  const { peers } = useLandingPresence();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 8);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Incrementing delay per hero element for the entrance stagger.
  let staggerMs = 0;
  const riseIn = () => {
    const delay = staggerMs;
    staggerMs += 70;
    return { ...stylex.props(landing.rise), style: { animationDelay: `${delay}ms` } };
  };

  const toLogin = () => navigate({ to: '/login' });
  const toPlanner = () => navigate({ to: '/' });
  const afterGuestSignIn = () => navigate({ to: '/' });

  return (
    <div {...stylex.props(landing.page)}>
      <div {...stylex.props(landing.navBand, scrolled && landing.navScrolled)}>
        <nav {...stylex.props(landing.nav)}>
          <span {...stylex.props(landing.brand)}>
            <BrandMark />
            주간 계획표
          </span>
          <div {...stylex.props(landing.navRight)}>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              {...stylex.props(landing.iconBtn)}
            >
              <IconSwap
                active={theme === 'dark'}
                activeIcon={<Sun size={16} strokeWidth={1.75} />}
                inactiveIcon={<Moon size={16} strokeWidth={1.75} />}
              />
            </button>
            {signedIn ? (
              <button type="button" onClick={toPlanner} {...stylex.props(landing.navLink)}>
                시간표 열기
              </button>
            ) : (
              <button type="button" onClick={toLogin} {...stylex.props(landing.navLink)}>
                로그인
              </button>
            )}
          </div>
        </nav>
      </div>

      <main>
        {/* ── Hero ─────────────────────────────────────────── */}
        <div {...stylex.props(landing.shell)}>
          <section {...stylex.props(landing.hero)}>
            <div {...stylex.props(landing.heroCopy)}>
              <span {...riseIn()} {...stylex.props(landing.eyebrow)}>
                실시간으로 함께 쓰는 주간 시간표
              </span>
              <h1 {...riseIn()} {...stylex.props(landing.h1)}>
                한 주를,
                <br />
                <span {...stylex.props(landing.h1Accent)}>한 화면에.</span>
              </h1>
              <p {...riseIn()} {...stylex.props(landing.lede)}>
                드래그 한 번으로 일정을 만들고, 색으로 분류하고, 링크로 나눠요. 팀과 함께 편집한
                내용은 그 자리에서 동기화됩니다.
              </p>
              <div {...riseIn()} {...stylex.props(landing.ctaRow)}>
                {signedIn ? (
                  <OpenPlannerButton onClick={toPlanner} />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={toLogin}
                      {...stylex.props(landing.btn, landing.btnPrimary)}
                    >
                      이메일로 로그인
                      <ArrowRight size={17} strokeWidth={2} {...stylex.props(landing.btnArrow)} />
                    </button>
                    <GuestButton
                      variant="ghost"
                      showArrow={false}
                      onSignedIn={afterGuestSignIn}
                    />
                  </>
                )}
              </div>
              <p {...riseIn()} {...stylex.props(landing.ctaNote)}>
                {signedIn
                  ? '이미 로그인되어 있어요. 시간표로 바로 이동할 수 있습니다.'
                  : '이메일로 로그인하거나 · 게스트로 바로 시작해도 괜찮아요.'}
              </p>
            </div>

            <div {...riseIn()} {...stylex.props(landing.previewWrap)}>
              <div {...stylex.props(landing.presenceSlot)}>
                <PresenceAvatars peers={peers} />
              </div>
              <PlannerPreview />
            </div>
          </section>
        </div>

        {/* ── Features ─────────────────────────────────────── */}
        <div {...stylex.props(landing.shell)}>
          <section {...stylex.props(landing.section)} id="features">
            <div {...stylex.props(landing.sectionHead)}>
              <p {...stylex.props(landing.kicker)}>기능</p>
              <h2 {...stylex.props(landing.h2)}>한 주를 계획하는 데 필요한 전부</h2>
              <p {...stylex.props(landing.sectionSub)}>
                복잡한 설정 없이, 딱 필요한 것만. 매일 여는 도구인 만큼 빠르고 조용하게 동작하도록
                만들었어요.
              </p>
            </div>
            <div {...stylex.props(landing.features)}>
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <article key={title} {...stylex.props(landing.card)}>
                  <span {...stylex.props(landing.cardIcon)}>
                    <Icon size={19} strokeWidth={1.75} />
                  </span>
                  <h3 {...stylex.props(landing.cardTitle)}>{title}</h3>
                  <p {...stylex.props(landing.cardBody)}>{body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* ── Guest auth spotlight (signed-out) / open planner (signed-in) ── */}
        <div {...stylex.props(landing.shell)}>
          <section {...stylex.props(landing.section)} id="guest" style={{ paddingTop: 0 }}>
            <div {...stylex.props(landing.guest)}>
              <div {...stylex.props(landing.guestCopy)}>
                {signedIn ? (
                  <>
                    <p {...stylex.props(landing.kicker)}>바로 시작</p>
                    <h2 {...stylex.props(landing.h2)}>시간표로 돌아가기</h2>
                    <p {...stylex.props(landing.sectionSub)}>
                      로그인된 상태예요. 만든 보드와 일정은 그대로 기다리고 있습니다.
                    </p>
                    <div {...stylex.props(landing.guestCta)}>
                      <OpenPlannerButton onClick={toPlanner} />
                    </div>
                  </>
                ) : (
                  <>
                    <p {...stylex.props(landing.kicker)}>게스트 모드</p>
                    <h2 {...stylex.props(landing.h2)}>가입 없이, 지금 바로 써보세요</h2>
                    <p {...stylex.props(landing.sectionSub)}>
                      게스트로 시작하면 계정을 만드는 순간을 미룰 수 있어요. 먼저 충분히 써보고,
                      마음에 들면 그때 이메일을 연결하면 됩니다. 게스트로 만든 시간표는 계정으로
                      그대로 이어져요.
                    </p>
                    <div {...stylex.props(landing.guestCta)}>
                      <GuestButton onSignedIn={afterGuestSignIn} />
                    </div>
                  </>
                )}
              </div>

              {!signedIn && (
                <ol {...stylex.props(landing.guestSteps)}>
                  {STEPS.map((s, i) => (
                    <li key={s.title}>
                      <div {...stylex.props(landing.step)}>
                        <span {...stylex.props(landing.stepNum)}>{i + 1}</span>
                        <span>
                          <span {...stylex.props(landing.stepTitle)}>{s.title}</span>
                          <span {...stylex.props(landing.stepBody)} style={{ display: 'block' }}>
                            {s.body}
                          </span>
                        </span>
                      </div>
                      {i < STEPS.length - 1 && <span {...stylex.props(landing.stepConnector)} />}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer {...stylex.props(landing.footer)}>
        <div {...stylex.props(landing.footerInner)}>
          <span {...stylex.props(landing.brand)}>
            <BrandMark />
            주간 계획표
          </span>
          <span {...stylex.props(landing.footerTxt)}>실시간으로 함께 쓰는 주간 시간표</span>
        </div>
      </footer>
    </div>
  );
}
