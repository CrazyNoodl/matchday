import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    valueCol: {
      minWidth: 28,
      alignItems: 'center',
    },
    value: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      textAlign: 'center',
    },
    valueNA: {
      color: colors.text.ghost,
    },
    subLabel: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      marginTop: 1,
    },
    barContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    barHalf: {
      flex: 1,
      height: 6,
      backgroundColor: colors.bg.elevated,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barInnerRight: {
      flex: 1,
      height: 6,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    bar: {
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      textAlign: 'center',
      minWidth: 60,
    },
    labelCol: {
      alignItems: 'center',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    labelSubText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.ghost,
      textAlign: 'center',
    },
    confidenceDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.accent.yellow,
    },
  });
