import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

/**
 * Vitest for the repo. Component tests (.vue) need the Vue plugin and a DOM
 * environment — they opt in per file with `// @vitest-environment happy-dom`
 * so the data-layer's plain-node tests (test/nutrition-client.test.ts) keep
 * running in the default node environment untouched.
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
