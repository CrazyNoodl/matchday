import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-a11y'],
  staticDirs: ['./static'],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      // Sheet (Reanimated-driven bottom sheet) never animates open without
      // this — Vite's default esbuild/oxc transform doesn't process
      // Reanimated's worklet directives, same plugin the app's own
      // babel.config.js applies.
      pluginReactOptions: {
        babel: {
          plugins: ['react-native-reanimated/plugin'],
        },
      },
    },
  },
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@': path.resolve(__dirname, '../src'),
      // Stories render outside a real navigation tree — stub the router
      // hook for the one component (NewRoundModal) that calls it.
      'expo-router': path.resolve(__dirname, './mocks/expo-router.ts'),
      // Native-only modules — depend on expo-modules-core internals that
      // don't bundle for web. Only reached from native-only branches in
      // ShareRoundModal/ShareStandingsModal, never exercised in the web
      // preview, but Vite still needs a resolvable, web-safe stand-in.
      'expo-media-library/legacy': path.resolve(__dirname, './mocks/expo-media-library-legacy.ts'),
      'expo-sharing': path.resolve(__dirname, './mocks/expo-sharing.ts'),
      // Reanimated-driven open/close animation never plays under Vite (see
      // mocks/gorhom-bottom-sheet.tsx) — swap in a plain-React stand-in so
      // Sheet/NewRoundModal stories actually show their content.
      '@gorhom/bottom-sheet': path.resolve(__dirname, './mocks/gorhom-bottom-sheet.tsx'),
    };
    return config;
  },
};

export default config;
