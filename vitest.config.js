import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    restoreMocks: true,
    env: {
      // config.js requires an app id at import time; tests never hit Instant.
      VITE_INSTANT_APP_ID:
        process.env.VITE_INSTANT_APP_ID || '00000000-0000-0000-0000-000000000000',
    },
  },
});
