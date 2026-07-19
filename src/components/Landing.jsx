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
import { t } from '../strings.js';
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

// Icons pair with copy by index; the text lives in the strings catalog.
const FEATURE_ICONS = [Users, Tags, Share2, Printer, WifiOff, CalendarRange];
const FEATURES = FEATURE_ICONS.map((icon, i) => ({ icon, ...t.landing.features[i] }));

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
    <div {...stylex.props(landing.preview)} role="img" aria-label={t.landing.previewLabel}>
      <div {...stylex.props(landing.pHead)}>
        <div {...stylex.props(landing.pCorner)}>{t.landing.gutterTime}</div>
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
  label = t.landing.startGuest,
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
      toast(ex?.body?.message || ex?.message || t.landing.startFailed);
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
          {t.landing.starting}
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

function OpenPlannerButton({ variant = 'primary', label = t.landing.openPlanner, style, onClick }) {
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

const STEPS = t.landing.steps;

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
            {t.landing.brand}
          </span>
          <div {...stylex.props(landing.navRight)}>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? t.landing.toggleLight : t.landing.toggleDark}
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
                {t.landing.openPlanner}
              </button>
            ) : (
              <button type="button" onClick={toLogin} {...stylex.props(landing.navLink)}>
                {t.common.login}
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
                {t.landing.heroTagline}
              </span>
              <h1 {...riseIn()} {...stylex.props(landing.h1)}>
                {t.landing.heroTitle1}
                <br />
                <span {...stylex.props(landing.h1Accent)}>{t.landing.heroTitleAccent}</span>
              </h1>
              <p {...riseIn()} {...stylex.props(landing.lede)}>
                {t.landing.heroLede}
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
                      {t.landing.loginEmail}
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
                  ? t.landing.ctaSignedIn
                  : t.landing.ctaSignedOut}
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
              <p {...stylex.props(landing.kicker)}>{t.landing.featuresKicker}</p>
              <h2 {...stylex.props(landing.h2)}>{t.landing.featuresTitle}</h2>
              <p {...stylex.props(landing.sectionSub)}>
                {t.landing.featuresSub}
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
                    <p {...stylex.props(landing.kicker)}>{t.landing.startNowKicker}</p>
                    <h2 {...stylex.props(landing.h2)}>{t.landing.backToPlannerTitle}</h2>
                    <p {...stylex.props(landing.sectionSub)}>
                      {t.landing.signedInSub}
                    </p>
                    <div {...stylex.props(landing.guestCta)}>
                      <OpenPlannerButton onClick={toPlanner} />
                    </div>
                  </>
                ) : (
                  <>
                    <p {...stylex.props(landing.kicker)}>{t.landing.guestKicker}</p>
                    <h2 {...stylex.props(landing.h2)}>{t.landing.guestTitle}</h2>
                    <p {...stylex.props(landing.sectionSub)}>
                      {t.landing.guestSub}
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
            {t.landing.brand}
          </span>
          <span {...stylex.props(landing.footerTxt)}>{t.landing.footerTagline}</span>
        </div>
      </footer>
    </div>
  );
}
