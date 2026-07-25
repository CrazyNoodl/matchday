import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      gap: Spacing.sm,
    },
    teamBadgeWrap: {
      position: 'relative',
    },
    teamColorSwatch: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.bg.surface,
    },
  });
