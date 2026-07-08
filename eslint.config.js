// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const expoConfig = require('eslint-config-expo/flat');
const storybookConfig = require('eslint-plugin-storybook').configs['flat/recommended'];

module.exports = defineConfig([
  expoConfig,
  storybookConfig,
  {
    // Playwright fixtures use a `use` callback param, which react-hooks
    // mistakes for the React `use` hook outside a component.
    files: ['e2e/**/*.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    // Plain Node CLI scripts, not app/bundled code.
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
