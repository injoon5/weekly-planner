import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    restoreMocks: true,
    // src/lib/config.js throws when VITE_INSTANT_APP_ID is unset, which
    // otherwise breaks every suite that transitively imports it on a fresh
    // clone / in CI. Tests never talk to Instant, so a placeholder id is fine.
    env: {
      VITE_INSTANT_APP_ID: '00000000-0000-0000-0000-000000000000',
    },
  },
});
