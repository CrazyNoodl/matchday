import React from 'react';
import { definePreview } from '@storybook/react-native-web-vite';
import { Colors } from '../src/theme/colors';

export default definePreview({
  parameters: {
    backgrounds: {
      default: 'app-dark',
      values: [
        { name: 'app-dark', value: Colors.bg.base },
        { name: 'surface', value: Colors.bg.surface },
        { name: 'elevated', value: Colors.bg.elevated },
        { name: 'light', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '24px', minHeight: '100px' }}>
        <Story />
      </div>
    ),
  ],
});
