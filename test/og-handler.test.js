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
          `/api/og?title=${encodeURIComponent('아주 긴 보드 이름입니다요')}&owner=${encodeURIComponent('긴이름이요정말로')}&n=3&e=${realE}`,
        ],
        [
          '06-password-like-default.png',
          `/api/og?title=${encodeURIComponent('주간 계획표')}`,
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
          '05-long-title-owner.png — long title/owner truncation',
          '06-password-like-default.png — password shares stay generic',
          '',
          `Generated from ${root}`,
        ].join('\n'),
      );
    },
    60_000,
  );
});
