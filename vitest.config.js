import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // Run tests serially
    threads: false,
    fileParallelism: false,

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Global setup/teardown
    globalSetup: './tests/helpers/globalSetup.ts',
    setupFiles: ['./tests/helpers/testSetup.ts'],

    // Isolate each test file
    isolate: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.ts',
        '**/*.test.ts',
        'prisma/',
      ],
    },
  },
});
