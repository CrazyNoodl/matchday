import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.sm,
    },
    side: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sideRight: {
      justifyContent: 'flex-end',
    },
    playerName: {
      flex: 1,
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      lineHeight: 18,
    },
    scoreBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
    },
    scoreText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['2xl'],
      lineHeight: 30,
      minWidth: 22,
      textAlign: 'center',
    },
    scoreSeparator: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.ghost,
      lineHeight: 30,
    },
    indicators: {
      width: '100%',
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    indicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.xs,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    indicatorIcon: {
      fontSize: 10,
    },
    indicatorCount: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 10,
      color: colors.text.muted,
    },
  });
