import { StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.elevated,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  rowLeader: {
    backgroundColor: Colors.accent.greenSubtle,
  },
  fixedCell: {
    paddingLeft: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border.default,
  },
  cell: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  playerCol: {
    width: 104,
    textAlign: 'left',
  },
  playerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  playerNames: {
    flex: 1,
    gap: 1,
  },
  playerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
  },
  playerNick: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  numCol: {
    width: 32,
  },
  numColPerGame: {
    width: 38,
    color: Colors.text.ghost,
  },
  ptsCell: {
    color: Colors.accent.green,
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
  },
  empty: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
});
