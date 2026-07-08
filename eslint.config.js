// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const expoConfig = require('eslint-config-expo/flat');
const storybookConfig = require('eslint-plugin-storybook').configs['flat/recommended'];
const prettierConfig = require('eslint-config-prettier');
const reactNativePlugin = require('eslint-plugin-react-native');

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
    // Type-aware rules — catch unhandled/misused promises, which is exactly
    // the class of bug behind past sync race incidents (see docs/CONTEXT.md).
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // 'warn' not 'error': most current hits are idiomatic React fire-and-forget
      // (async IIFE in useEffect, i18n.changeLanguage) rather than real bugs.
      // Kept visible so genuine missed-await races get caught going forward.
      '@typescript-eslint/no-floating-promises': 'warn',
      // attributes/properties:false — passing an async handler to onPress
      // (as a JSX attribute or nested in a props object like
      // confirm={{ onPress: d.confirmSignOut }}) is the standard RN pattern,
      // not a misuse; typescript-eslint's own documented tuning for React/RN.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false, properties: false } },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  {
    // Alert.alert breaks the web file picker (see docs/pitfalls.md) — everywhere
    // except src/store, MMKV must only be imported inside the storage adapter.
    // Tests are exempt: `import * as ReactNative` for jest.spyOn trips the
    // namespace-import check even when the test never touches Alert.
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    ignores: ['src/store/**', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Alert'],
              message:
                'Alert.alert breaks the file picker on web — use an in-app modal component instead (see CLAUDE.md).',
            },
            {
              name: 'react-native-mmkv',
              message: 'Import MMKV only inside src/store (see CLAUDE.md Storage section).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/store/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Alert'],
              message:
                'Alert.alert breaks the file picker on web — use an in-app modal component instead (see CLAUDE.md).',
            },
          ],
        },
      ],
    },
  },
  {
    // Colors must come from theme tokens, styles must live in *.styles.ts —
    // see CLAUDE.md Design System section.
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**'],
    plugins: {
      'react-native': reactNativePlugin,
    },
    rules: {
      'react-native/no-color-literals': 'warn',
      'react-native/no-inline-styles': 'warn',
    },
  },
  {
    ignores: ['dist/*'],
  },
  // Must stay last: turns off stylistic rules Prettier already enforces.
  prettierConfig,
]);
