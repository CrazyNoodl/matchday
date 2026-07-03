import React, { createContext, useContext } from 'react';
import { AppColors, colorsByScheme, DarkColors } from './colors';
import { useStore } from '@/store';

export const ThemeContext = createContext<AppColors>(DarkColors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useStore((s) => s.colorScheme);
  const colors = colorsByScheme[colorScheme ?? 'dark'];
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useColors(): AppColors {
  return useContext(ThemeContext);
}
