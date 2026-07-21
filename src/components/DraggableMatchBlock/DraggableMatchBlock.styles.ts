import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { Radius, Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    cardSlot: {
      flex: 1,
    },
    dragging: {
      zIndex: 10,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    handle: {
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handleIcon: {
      fontSize: 16,
      color: colors.text.ghost,
      letterSpacing: -1,
    },
    handleIconContainer: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.xs,
    },
  });
