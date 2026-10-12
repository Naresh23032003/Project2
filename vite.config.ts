/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts', 'test/golden/**/*.test.ts'],
    environment: 'node',
  },
});
