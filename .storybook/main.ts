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
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@': path.resolve(__dirname, '../src'),
    };
    return config;
  },
};

export default config;
