import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  glowGreen: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -80,
    left: -40,
    borderRadius: 170,
    backgroundColor: colors.accent.green,
    opacity: 0.06,
  },
  glowBlue: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -80,
    right: -40,
    borderRadius: 150,
    backgroundColor: colors.accent.blue,
    opacity: 0.05,
  },
});
