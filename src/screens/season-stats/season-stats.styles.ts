import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
  },

  // Tournament header
  tourHeader: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: 4,
  },
  tourName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  tourSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },

  // Include filter row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: colors.accent.green,
    borderColor: colors.accent.green,
  },
  filterChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  filterChipTextActive: {
    color: colors.accent.greenDark,
  },

  // Champion hero card
  champCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,212,94,0.30)',
    padding: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  champAvatarWrap: {
    borderWidth: 2,
    borderColor: colors.accent.gold,
    borderRadius: 19,
    padding: 2,
  },
  champAvatar: {
    // xl = 50px, borderRadius handled inside Avatar
  },
  champInfo: {
    flex: 1,
    gap: 3,
  },
  champBadgeLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  champName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: colors.text.primary,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  champMeta: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  champDiamond: {
    fontSize: 36,
    color: colors.accent.gold,
  },

  // Totals row
  totalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  totalCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 3,
  },
  totalValue: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    lineHeight: 24,
  },
  totalValueGreen: {
    color: colors.accent.green,
  },
  totalLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },

  // Section label
  sectionLabel: {
    marginBottom: Spacing.md,
  },

  // Param chips
  paramChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  paramChip: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  paramChipActive: {
    borderColor: colors.accent.greenBorder,
    backgroundColor: colors.accent.greenSubtle,
  },
  paramChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  paramChipTextActive: {
    color: colors.accent.green,
  },

  // Ranking cards
  rankCardSpacing: {
    marginBottom: Spacing.sm,
  },

  // Games / rounds table
  roundBlock: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    backgroundColor: colors.bg.surface,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  roundNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roundNumText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  roundHeaderInfo: {
    flex: 1,
    gap: 1,
  },
  roundHeaderTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  roundHeaderDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  friendlyTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.surface,
  },
  friendlyTagText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  roundWinnerArea: {
    flexShrink: 0,
  },
  roundEmptyRow: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  roundEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.placeholder,
  },
});
