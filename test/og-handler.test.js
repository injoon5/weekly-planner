import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { encodeOgEvents } from '../src/server/og-meta.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const previewDir = '/opt/cursor/artifacts/og-previews';

async function renderOg(urlPath) {
  const { default: handler } = await import('../api/og.js');
  return new Promise((resolve, reject) => {
    const chunks = [];
    const res = {
      statusCode: 0,
      headers: {},
      setHeader(key, value) {
        this.headers[key.toLowerCase()] = value;
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: Buffer.concat(chunks),
        });
      },
    };
    handler(
      {
        method: 'GET',
        url: urlPath,
        headers: { host: 'plan.ij5.dev' },
      },
      res,
    ).catch(reject);
  });
}

describe('/api/og handler', () => {
  it('writes a PNG to the Node response (Vercel serverless shape)', async () => {
    const { status, headers, body } = await renderOg('/api/og?title=팀%20위클리');

    expect(status).toBe(200);
    expect(headers['content-type']).toMatch(/image\/png/);
    expect(body.byteLength).toBeGreaterThan(10_000);
    expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('renders open-share cards with owner + real schedule payload', async () => {
    const e = encodeOgEvents([
      { day: 1, start: 240, dur: 90, color: 'sky', title: '팀 회의' },
      { day: 2, start: 210, dur: 90, color: 'coral', title: '스터디' },
      { day: 3, start: 270, dur: 90, color: 'violet', title: '디자인 리뷰' },
      { day: 4, start: 180, dur: 60, color: 'green', title: '운동' },
      { day: 5, start: 300, dur: 120, color: 'amber', title: '멘토링' },
    ]);
    const { status, body } = await renderOg(
      `/api/og?title=${encodeURIComponent('팀 위클리')}&owner=${encodeURIComponent('인준')}&n=12&e=${e}`,
    );
    expect(status).toBe(200);
    expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(body.byteLength).toBeGreaterThan(10_000);
  });

  it('renders empty real schedules without falling back to the demo grid crash', async () => {
    const e = encodeOgEvents([]);
    const { status, body } = await renderOg(
      `/api/og?title=${encodeURIComponent('빈 보드')}&owner=${encodeURIComponent('인준')}&e=${e}`,
    );
    expect(status).toBe(200);
    expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('renders password-locked cards with pastel gradient wash', async () => {
    const { status, body } = await renderOg('/api/og?title=%EC%A3%BC%EA%B0%84%20%EA%B3%84%ED%9A%8D%ED%91%9C&locked=1');
    expect(status).toBe(200);
    expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(body.byteLength).toBeGreaterThan(10_000);
  });

  it('rejects non-GET methods', async () => {
    const { default: handler } = await import('../api/og.js');

    const { status } = await new Promise((resolve) => {
      const res = {
        statusCode: 0,
        headers: {},
        setHeader() {},
        end() {
          resolve({ status: this.statusCode });
        },
      };
      void handler({ method: 'POST', url: '/api/og', headers: {} }, res);
    });

    expect(status).toBe(405);
  });

  it(
    'writes preview PNGs for review',
    async () => {
      mkdirSync(previewDir, { recursive: true });

      const realE = encodeOgEvents([
        { day: 1, start: 240, dur: 90, color: 'sky', title: '팀 회의' },
        { day: 1, start: 420, dur: 60, color: 'green', title: '운동' },
        { day: 2, start: 210, dur: 90, color: 'coral', title: '스터디' },
        { day: 2, start: 360, dur: 60, color: 'amber', title: '점심 약속' },
        { day: 3, start: 270, dur: 90, color: 'violet', title: '디자인 리뷰' },
        { day: 3, start: 450, dur: 90, color: 'sky', title: '프로젝트' },
        { day: 4, start: 180, dur: 60, color: 'teal', title: '운동' },
        { day: 4, start: 330, dur: 90, color: 'pink', title: '수업' },
        { day: 5, start: 240, dur: 60, color: 'amber', title: '멘토링' },
        { day: 5, start: 390, dur: 120, color: 'graphite', title: '작업 시간' },
      ]);

      const longTitle =
        '이것은정말로아주아주긴보드이름이라서반드시잘려야하는예시입니다추가텍스트';
      const longOwner =
        '이건진짜로엄청나게긴소유자이름이라서말줄임표가보여야합니다';

      const colors = ['sky', 'coral', 'amber', 'green', 'violet', 'teal', 'pink', 'graphite'];
      // Dense Mon–Fri grid: every hour 09:00–14:00, 1h blocks, very long titles.
      const fullGrid = [];
      for (let d = 1; d <= 5; d++) {
        for (let hour = 0; hour < 6; hour++) {
          const start = 180 + hour * 60; // 09:00 …
          fullGrid.push({
            day: d,
            start,
            dur: 60,
            color: colors[(d + hour) % colors.length],
            title: `매우긴일정제목이라카드안에서잘려야하는예시${d}${hour}추가설명텍스트입니다`,
          });
        }
      }
      const fullE = encodeOgEvents(fullGrid);

      // Mix of 30-min (title only) + longer blocks with times.
      const halfHour = encodeOgEvents([
        { day: 1, start: 180, dur: 30, color: 'sky', title: '스탠드업' },
        { day: 1, start: 240, dur: 30, color: 'coral', title: '매우긴삼십분일정제목예시입니다' },
        { day: 1, start: 300, dur: 60, color: 'green', title: '한시간 작업' },
        { day: 2, start: 210, dur: 30, color: 'amber', title: '콜' },
        { day: 2, start: 270, dur: 30, color: 'violet', title: '짧은 미팅' },
        { day: 2, start: 360, dur: 90, color: 'teal', title: '긴 리뷰 세션' },
        { day: 3, start: 180, dur: 30, color: 'pink', title: '체크인' },
        { day: 3, start: 240, dur: 30, color: 'graphite', title: '메일 확인하기' },
        { day: 3, start: 300, dur: 30, color: 'sky', title: '티타임' },
        { day: 3, start: 420, dur: 60, color: 'coral', title: '운동' },
        { day: 4, start: 180, dur: 30, color: 'green', title: '매우긴제목이라잘리는삼십분카드' },
        { day: 4, start: 240, dur: 30, color: 'amber', title: '1:1' },
        { day: 4, start: 330, dur: 90, color: 'violet', title: '디자인 리뷰' },
        { day: 5, start: 210, dur: 30, color: 'pink', title: '브리핑' },
        { day: 5, start: 270, dur: 30, color: 'teal', title: '빠른 동기화 미팅' },
        { day: 5, start: 360, dur: 120, color: 'sky', title: '집중 작업' },
      ]);

      const cases = [
        ['01-default.png', '/api/og'],
        ['02-titled-demo.png', `/api/og?title=${encodeURIComponent('팀 위클리')}`],
        [
          '03-open-with-owner-schedule.png',
          `/api/og?title=${encodeURIComponent('팀 위클리')}&owner=${encodeURIComponent('인준')}&n=12&e=${realE}`,
        ],
        [
          '04-open-empty-schedule.png',
          `/api/og?title=${encodeURIComponent('빈 보드')}&owner=${encodeURIComponent('인준')}&e=${encodeOgEvents([])}`,
        ],
        [
          '05-long-title-owner.png',
          `/api/og?title=${encodeURIComponent(longTitle)}&owner=${encodeURIComponent(longOwner)}&n=3&e=${realE}`,
        ],
        [
          '06-password-locked.png',
          `/api/og?title=${encodeURIComponent('주간 계획표')}&locked=1`,
        ],
        [
          '07-full-grid-long-cards.png',
          `/api/og?title=${encodeURIComponent('풀 그리드')}&owner=${encodeURIComponent('인준')}&n=${fullGrid.length}&e=${fullE}`,
        ],
        [
          '08-half-hour-title-only.png',
          `/api/og?title=${encodeURIComponent('30분 일정')}&owner=${encodeURIComponent('인준')}&n=16&e=${halfHour}`,
        ],
      ];

      for (const [name, path] of cases) {
        const { status, body } = await renderOg(path);
        expect(status).toBe(200);
        expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        writeFileSync(join(previewDir, name), body);
      }

      writeFileSync(
        join(previewDir, 'README.txt'),
        [
          'OG card previews (1200×630)',
          '01-default.png — landing / product default (demo grid)',
          '02-titled-demo.png — titled but still demo grid (no e=)',
          '03-open-with-owner-schedule.png — open share with owner + real events',
          '04-open-empty-schedule.png — open share, empty board (no demo fallback)',
          '05-long-title-owner.png — long title/owner truncation (ellipsis)',
          '06-password-locked.png — password share: pastel gradient wash + lock',
          '07-full-grid-long-cards.png — dense 1h grid with very long event titles',
          '08-half-hour-title-only.png — 30-min cards show title only (no time)',
          '',
          `Generated from ${root}`,
        ].join('\n'),
      );
    },
    120_000,
  );
});
