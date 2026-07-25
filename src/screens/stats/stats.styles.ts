import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },

    // Tab pills
    tabRow: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },

    // Scroll
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Spacing['3xl'],
    },

    // Tab content
    tabContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      gap: Spacing.md,
    },
    sectionLabel: {
      marginBottom: Spacing.xs,
    },

    // Ranking card
    // Stat tiles
    tilesRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
  });
