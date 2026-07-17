import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

describe('vercel SPA hosting', () => {
  it('does not enable cleanUrls (breaks /index.html SPA fallback)', () => {
    // cleanUrls remaps index.html → /, so a rewrite destination of
    // /index.html 404s at the edge. Share recipients opening /s/:token
    // hard-navigate and hit NOT_FOUND; owners loading / never notice.
    expect(vercel.cleanUrls).not.toBe(true);
  });

  it('rewrites non-API paths to the SPA shell', () => {
    const rewrites = vercel.rewrites || [];
    const spa = rewrites.find(
      (r) => typeof r.destination === 'string' && r.destination.includes('index.html'),
    );
    expect(spa).toBeTruthy();
    expect(spa.source).toMatch(/api/);
  });

  it('routes nested REST paths through a single /api/v1 entry', () => {
    // Vite-on-Vercel has no multi-segment catch-all, so nested
    // `/api/v1/boards/:id/events` rewrites to one serverless file.
    const rewrites = vercel.rewrites || [];
    const rest = rewrites.find(
      (r) => r.source === '/api/v1/(.*)' && r.destination === '/api/v1',
    );
    expect(rest).toBeTruthy();
    expect(existsSync(join(root, 'api/v1.js'))).toBe(true);
    expect(existsSync(join(root, 'src/server/rest-api.js'))).toBe(true);
    expect(existsSync(join(root, 'api/v1/[a].js'))).toBe(false);
    expect(existsSync(join(root, 'api/v1/[...path].js'))).toBe(false);
  });
});
