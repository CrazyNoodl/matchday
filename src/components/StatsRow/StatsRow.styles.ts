import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  value: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    width: 28,
    textAlign: 'center',
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
    backgroundColor: Colors.bg.elevated,
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
    color: Colors.text.muted,
    textAlign: 'center',
    minWidth: 60,
  },
});
