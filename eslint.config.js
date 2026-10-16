// Flat config equivalent of the previous .eslintrc.js:
//   extends: eslint:recommended,
//            plugin:@typescript-eslint/eslint-recommended,
//            plugin:@typescript-eslint/recommended
//   overrides: src/*.ts -> @typescript-eslint/no-explicit-any off
//
// Scoped to **/*.ts to preserve the old `eslint . --ext .ts` lint surface.
const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

const tsFiles = ['**/*.ts'];

module.exports = [
  {
    // Never lint generated output; previously these only produced warnings
    // (no-explicit-any was 'warn' in typescript-eslint v5, 'error' in v8).
    ignores: ['build/**', 'coverage/**', 'docs/**', 'dist/**', 'node_modules/**'],
  },
  {
    files: tsFiles,
    ...js.configs.recommended,
  },
  ...tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: config.files ?? tsFiles,
  })),
  {
    files: ['src/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
