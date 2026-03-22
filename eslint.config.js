import globals from 'globals';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

export default [
  {
    ignores: ['thunderdown/vendor/**'],
  },
  {
    files: ['thunderdown/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        messenger: 'readonly',
        marked: 'readonly',
        hljs: 'readonly',
        Thunderdown: 'readonly',
        ThunderdownState: 'readonly',
      },
    },
    plugins: {
      'no-unsanitized': noUnsanitized,
    },
    rules: {
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
];
