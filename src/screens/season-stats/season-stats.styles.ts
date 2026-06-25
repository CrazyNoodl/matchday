import { StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
  },

  tourHeader: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: 4,
  },
  tourName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  tourSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  filterChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  filterChipTextActive: {
    color: Colors.accent.greenDark,
  },

  champCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,212,94,0.30)',
    padding: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  champAvatarWrap: {
    borderWidth: 2,
    borderColor: Colors.accent.gold,
    borderRadius: 19,
    padding: 2,
  },
  champAvatar: {},
  champInfo: {
    flex: 1,
    gap: 3,
  },
  champBadgeLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  champName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: Colors.text.primary,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  champMeta: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  champDiamond: {
    fontSize: 36,
    color: Colors.accent.gold,
  },

  totalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  totalCard: {
    flex: 1,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 3,
  },
  totalValue: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  totalValueGreen: {
    color: Colors.accent.green,
  },
  totalLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.8,
  },

  sectionLabel: {
    marginBottom: Spacing.md,
  },

  paramChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  paramChip: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  paramChipActive: {
    borderColor: Colors.accent.greenBorder,
    backgroundColor: Colors.accent.greenSubtle,
  },
  paramChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  paramChipTextActive: {
    color: Colors.accent.green,
  },

  rankCardSpacing: {
    marginBottom: Spacing.sm,
  },

  roundBlock: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    backgroundColor: Colors.bg.surface,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.elevated,
  },
  roundNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roundNumText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  roundHeaderInfo: {
    flex: 1,
    gap: 1,
  },
  roundHeaderTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  roundHeaderDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  friendlyTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    backgroundColor: Colors.bg.surface,
  },
  friendlyTagText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
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
    color: Colors.text.muted,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.placeholder,
  },
});
