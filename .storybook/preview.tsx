import React from 'react';
import { definePreview } from '@storybook/react-native-web-vite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeContext, colorsByScheme, type ColorScheme } from '../src/theme';
// Side-effect import — initializes the i18next singleton so components
// using useTranslation() (e.g. NewRoundModal) render real copy instead of
// raw translation keys.
import '../src/i18n';

export default definePreview({
  initialGlobals: {
    theme: 'dark',
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'App color scheme',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', icon: 'circle', title: 'Dark' },
          { value: 'light', icon: 'circlehollow', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
  },
  decorators: [
    (Story, context) => {
      const scheme: ColorScheme = context.globals.theme === 'light' ? 'light' : 'dark';
      const colors = colorsByScheme[scheme];
      // Stories that opt into `layout: 'fullscreen'` (e.g. MediaSlider,
      // LoginScreen) size themselves off the real window/iframe dimensions —
      // our own 24px padding wrapper would clip them and misalign anything
      // measured via Dimensions/useWindowDimensions, so skip it for those.
      const isFullscreen = context.parameters.layout === 'fullscreen';
      // `flex: 1` only expands into an ancestor with a *definite* height —
      // without one here, every flex:1 chain below (GestureHandlerRootView,
      // SafeAreaProvider, Sheet's own overlay) collapses to its content's
      // natural size instead of the viewport. That breaks anything anchored
      // via `position: absolute; bottom: 0` (bottom sheets, full-screen
      // overlays), which then pins to the bottom of the collapsed box
      // instead of the visible screen.
      return (
        <div style={{ height: '100vh' }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <ThemeContext.Provider value={colors}>
                <div
                  style={
                    isFullscreen
                      ? { background: colors.bg.base, height: '100%' }
                      : { padding: '24px', minHeight: '100%', background: colors.bg.base }
                  }
                >
                  <Story />
                </div>
              </ThemeContext.Provider>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </div>
      );
    },
  ],
});
