import { describe, expect, it } from 'vitest';

describe('/api/og handler', () => {
  it('writes a PNG to the Node response (Vercel serverless shape)', async () => {
    const { default: handler } = await import('../api/og.js');

    const { status, headers, body } = await new Promise((resolve, reject) => {
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
          url: '/api/og?title=팀%20위클리',
          headers: { host: 'plan.ij5.dev' },
        },
        res,
      ).catch(reject);
    });

    expect(status).toBe(200);
    expect(headers['content-type']).toMatch(/image\/png/);
    expect(body.byteLength).toBeGreaterThan(10_000);
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
});
