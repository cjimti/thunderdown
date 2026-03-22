import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['thunderdown/lib/**/*.js', 'thunderdown/background.js'],
      exclude: ['thunderdown/vendor/**'],
      thresholds: { lines: 80, functions: 80, branches: 80 },
    },
  },
});
