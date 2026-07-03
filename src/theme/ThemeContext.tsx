import React, { createContext, useContext } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { AppColors, ColorScheme, colorsByScheme, DarkColors } from './colors';
import { useStore } from '@/store';

export const ThemeContext = createContext<AppColors>(DarkColors);

export function useEffectiveColorScheme(): ColorScheme {
  const preference = useStore((s) => s.colorScheme);
  const systemScheme = useSystemColorScheme();
  if (preference === 'auto') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return preference ?? 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useEffectiveColorScheme();
  const colors = colorsByScheme[scheme];
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useColors(): AppColors {
  return useContext(ThemeContext);
}
