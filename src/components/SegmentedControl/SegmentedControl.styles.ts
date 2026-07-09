import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    trackBoxed: {
      flexDirection: 'row',
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.lg,
      padding: 3,
      alignSelf: 'flex-start',
    },
    segBoxed: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm - 1,
      borderRadius: Radius.md,
    },
    segBoxedActive: {
      backgroundColor: colors.bg.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    textBoxed: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },
    textBoxedActive: {
      color: colors.text.primary,
    },

    trackPill: {
      flexDirection: 'row',
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.full,
      padding: 3,
      gap: 3,
    },
    segPill: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segPillActive: {
      backgroundColor: colors.accent.green,
    },
    textPill: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      letterSpacing: 0.2,
    },
    textPillActive: {
      color: colors.accent.greenDark,
    },
    textPillInactive: {
      color: colors.text.muted,
    },
  });
