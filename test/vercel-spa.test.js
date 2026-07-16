import { readFileSync } from 'node:fs';
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
    const spa = (vercel.rewrites || []).find(
      (r) => typeof r.destination === 'string' && r.destination.includes('index.html'),
    );
    expect(spa).toBeTruthy();
  });
});
