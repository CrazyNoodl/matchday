import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    playerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    playerRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: Spacing.sm,
    },
    playerName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
      flexShrink: 1,
    },
    gamesWrap: {
      paddingHorizontal: Spacing.sm,
    },
    gamesText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      textAlign: 'center',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    winsCount: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      lineHeight: 28,
    },
    drawsLabel: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      flex: 1,
      textAlign: 'center',
    },
    barContainer: {
      flexDirection: 'row',
      height: 6,
      borderRadius: Radius.full,
      overflow: 'hidden',
      alignItems: 'center',
    },
    barSegment: {
      height: 6,
    },
    barGap: {
      width: 3,
      height: 6,
      backgroundColor: colors.bg.base,
    },
    goals: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      textAlign: 'center',
    },
  });
