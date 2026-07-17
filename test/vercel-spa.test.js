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
    expect(rewrites.some((r) => r.destination?.startsWith('/api/'))).toBe(true);
  });

  it('exposes one REST entrypoint per path depth (no Vite catch-all)', () => {
    // [...path] only matches a single segment on non-Next Vercel projects, so
    // /api/v1/boards/:id was platform NOT_FOUND while /api/v1/boards worked.
    const entries = [
      'api/v1/[a].js',
      'api/v1/[a]/[b].js',
      'api/v1/[a]/[b]/[c].js',
      'src/server/rest-api.js',
    ];
    for (const rel of entries) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(existsSync(join(root, 'api/v1/[...path].js'))).toBe(false);
  });
});
