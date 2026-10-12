import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.claude', 'coverage', 'playwright-report', 'test-results', 'test/fixtures/**', 'dev-dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['scripts/**/*.mjs', 'public/**/*.js'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', localStorage: 'readonly', document: 'readonly' } },
  },
);
