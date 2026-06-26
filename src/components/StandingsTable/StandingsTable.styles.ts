import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  rowLeader: {
    backgroundColor: colors.accent.greenSubtle,
  },
  fixedCell: {
    paddingLeft: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  cell: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.secondary,
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
    color: colors.text.primary,
  },
  playerNick: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  numCol: {
    width: 32,
  },
  numColPerGame: {
    width: 38,
    color: colors.text.ghost,
  },
  ptsCell: {
    color: colors.accent.green,
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
    color: colors.text.muted,
  },
});
