import { StyleSheet } from 'react-native';
import { Spacing } from '@/theme/spacing';

export const sheetFooterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  buttonWrap: {
    flex: 1,
  },
});
