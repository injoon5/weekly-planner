import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import * as stylex from '@stylexjs/stylex';
import { ArrowRight } from 'lucide-react';
import { db } from '../db.js';
import { landing } from '../styles/landing.js';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = ['06', '08', '10', '12', '14', '16', '18', '20'];

const FEATURES = [
  {
    title: '게스트로 바로 시작',
    body: '계정 없이 바로 시간표를 만드세요. 나중에 이메일로 올리면 데이터가 그대로 남습니다.',
    guest: true,
  },
  {
    title: '매직 코드 로그인',
    body: '이메일로 6자리 코드를 보내드려요. 비밀번호 없이, 계정이 없으면 자동으로 만들어집니다.',
  },
  {
    title: '실시간 동기화',
    body: '보드와 일정이 기기 사이에서 바로 맞춰집니다. 새로고침이나 저장 버튼을 기다릴 필요 없어요.',
    live: true,
  },
  {
    title: '드래그로 일정 편집',
    body: '클릭·드래그로 만들고, 블록을 끌어 옮기거나 가장자리로 길이를 조절하세요.',
  },
  {
    title: '여러 보드 · 공유 링크',
    body: '보드를 나눠 쓰고, 링크나 비밀번호로 팀과 함께 보세요. 편집 권한도 조절할 수 있어요.',
  },
  {
    title: '인쇄 · 다크 모드',
    body: '주간 계획표를 깔끔하게 인쇄하고, 라이트/다크 테마로 눈에 맞게 쓰세요.',
  },
];

const DEMO_BLOCKS = [
  { day: 1, row: 1, style: landing.blockCoral, label: '딥 워크' },
  { day: 2, row: 3, style: landing.blockSky, label: '미팅' },
  { day: 3, row: 2, style: landing.blockGreen, label: '운동' },
  { day: 5, row: 4, style: landing.blockAmber, label: '리뷰' },
];

function BrandMark() {
  return (
    <span {...stylex.props(landing.mark)} aria-hidden="true">
      <i {...stylex.props(landing.markA)} />
      <i {...stylex.props(landing.markB)} />
    </span>
  );
}

function useReveal() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return undefined;
    }
    const root = el.closest('[data-landing-scroll]');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { root: root || null, rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}

function HeroStage() {
  return (
    <div {...stylex.props(landing.stage)} aria-hidden="true">
      <div {...stylex.props(landing.stageGrid)}>
        <div />
        {DAYS.map((d, i) => (
          <div
            key={d}
            {...stylex.props(
              landing.headCell,
              i === 0 && landing.headSun,
              i === 6 && landing.headSat,
            )}
          >
            {d}
          </div>
        ))}
        {HOURS.map((h, row) => (
          <div key={h} style={{ display: 'contents' }}>
            <div {...stylex.props(landing.gutCell)}>{h}</div>
            {DAYS.map((_, day) => {
              const block = DEMO_BLOCKS.find((b) => b.day === day && b.row === row);
              return (
                <div key={`${h}-${day}`} {...stylex.props(landing.cell)}>
                  {block && (
                    <div {...stylex.props(landing.block, block.style)}>{block.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Landing() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const featuresReveal = useReveal();
  const guestReveal = useReveal();

  const tryGuest = async () => {
    setBusy(true);
    setErr('');
    try {
      await db.auth.signInAsGuest();
    } catch (ex) {
      setErr(ex?.body?.message || ex?.message || '게스트 로그인에 실패했어요');
      setBusy(false);
    }
  };

  return (
    <div {...stylex.props(landing.root)} data-landing-scroll>
      <div {...stylex.props(landing.atmosphere)} aria-hidden="true" />
      <div {...stylex.props(landing.grain)} aria-hidden="true" />

      <div {...stylex.props(landing.shell)}>
        <nav {...stylex.props(landing.nav)}>
          <a {...stylex.props(landing.navBrand)} href="/">
            <BrandMark />
            <span {...stylex.props(landing.navName)}>주간 계획표</span>
          </a>
          <div {...stylex.props(landing.navActions)}>
            <Link to="/login" {...stylex.props(landing.btn, landing.btnSecondary, landing.navBtn)}>
              로그인
            </Link>
          </div>
        </nav>

        <header {...stylex.props(landing.hero)}>
          <div {...stylex.props(landing.heroCopy)}>
            <h1 {...stylex.props(landing.brand, landing.enter, landing.d1)}>주간 계획표</h1>
            <p {...stylex.props(landing.headline, landing.enter, landing.d2)}>
              한 주를 한눈에. 실시간으로 맞춰지는 시간표.
            </p>
            <p {...stylex.props(landing.support, landing.enter, landing.d3)}>
              게스트로 바로 써보고, 필요할 때 이메일로 계정을 남기세요.
            </p>
            <div {...stylex.props(landing.ctas, landing.enter, landing.d4)}>
              <button
                type="button"
                {...stylex.props(landing.btn, landing.btnPrimary)}
                onClick={tryGuest}
                disabled={busy}
              >
                {busy ? '시작하는 중…' : '게스트로 시작'}
                {!busy && <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />}
              </button>
              <Link to="/login" {...stylex.props(landing.btn, landing.btnSecondary)}>
                이메일로 로그인
              </Link>
            </div>
            {err && (
              <p {...stylex.props(landing.err)} role="alert">
                {err}
              </p>
            )}
          </div>
          <div {...stylex.props(landing.enter, landing.d5)}>
            <HeroStage />
          </div>
        </header>

        <section
          ref={featuresReveal.ref}
          {...stylex.props(
            landing.features,
            landing.reveal,
            landing.revealReduce,
            featuresReveal.inView && landing.revealIn,
          )}
          aria-labelledby="features-heading"
        >
          <div {...stylex.props(landing.sectionHead)}>
            <h2 id="features-heading" {...stylex.props(landing.sectionTitle)}>
              필요한 것만, 정확하게
            </h2>
            <p {...stylex.props(landing.sectionCopy)}>
              주간 일정을 만들고 공유하는 데 실제로 쓰이는 기능만 모았습니다.
            </p>
          </div>
          <div {...stylex.props(landing.featureList)}>
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                {...stylex.props(landing.feature, i % 2 === 1 && landing.featureOdd)}
              >
                <h3 {...stylex.props(landing.featureLabel)}>
                  <span
                    {...stylex.props(
                      landing.featureDot,
                      f.guest && landing.featureDotGuest,
                      f.live && landing.featureDotLive,
                    )}
                    aria-hidden="true"
                  />
                  {f.title}
                </h3>
                <p {...stylex.props(landing.featureBody)}>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          ref={guestReveal.ref}
          {...stylex.props(
            landing.guestDemo,
            landing.reveal,
            landing.revealReduce,
            guestReveal.inView && landing.revealIn,
          )}
          aria-labelledby="guest-heading"
        >
          <div {...stylex.props(landing.guestPanel)}>
            <div>
              <p {...stylex.props(landing.guestKicker)}>Instant Guest Auth</p>
              <h2 id="guest-heading" {...stylex.props(landing.guestTitle)}>
                가입 전에 먼저 써보세요
              </h2>
              <p {...stylex.props(landing.guestBody)}>
                InstantDB 게스트 인증으로 임시 계정이 만들어집니다. 이메일로 업그레이드하면 같은
                사용자 id를 유지해, 게스트로 만든 보드가 그대로 이어집니다.
              </p>
              <div {...stylex.props(landing.guestActions)}>
                <button
                  type="button"
                  {...stylex.props(landing.btn, landing.btnPrimary)}
                  onClick={tryGuest}
                  disabled={busy}
                >
                  {busy ? '시작하는 중…' : '게스트로 체험'}
                </button>
                <Link to="/login" {...stylex.props(landing.btn, landing.btnSecondary)}>
                  코드로 로그인
                </Link>
              </div>
            </div>

            <div {...stylex.props(landing.guestStatus)} aria-label="게스트 인증 미리보기">
              <div {...stylex.props(landing.statusRow)}>
                <span {...stylex.props(landing.statusLabel)}>상태</span>
                <span {...stylex.props(landing.pill)}>
                  <span {...stylex.props(landing.pillDot)} aria-hidden="true" />
                  Guest
                </span>
              </div>
              <div {...stylex.props(landing.statusRow)}>
                <span {...stylex.props(landing.statusLabel)}>auth.signInAsGuest()</span>
                <span {...stylex.props(landing.statusValue)}>준비됨</span>
              </div>
              <div {...stylex.props(landing.statusRow)}>
                <span {...stylex.props(landing.statusLabel)}>user.isGuest</span>
                <span {...stylex.props(landing.statusValue)}>true → false</span>
              </div>
              <p {...stylex.props(landing.statusHint)}>
                업그레이드 시 매직 코드로 이메일을 연결하면, 기존에 만든 일정이 계정에 남습니다.
              </p>
            </div>
          </div>
        </section>

        <footer {...stylex.props(landing.footer)}>
          <span>주간 계획표 · Weekly Planner</span>
          <Link to="/login" {...stylex.props(landing.footerLink)}>
            이메일로 시작하기
          </Link>
        </footer>
      </div>
    </div>
  );
}
