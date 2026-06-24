import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  // ---- card variant ----
  cardOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  badgeCard: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeTextCard: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.text.secondary,
  },
  infoCard: {
    gap: 2,
    width: 60,
    flexShrink: 0,
  },
  dateCard: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.text.secondary,
  },
  matchCount: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  winnerAreaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  winnerNameCard: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  friendlyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  friendlyBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.4,
  },
  chevronCard: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.muted,
    lineHeight: 24,
  },

  // ---- row variant ----
  rowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    gap: Spacing.md,
  },
  badgeRow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeTextRow: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  infoRow: {
    flex: 1,
    gap: 1,
  },
  dateRow: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  winnerAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  avatarRow: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  winnerNameRow: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
    maxWidth: 72,
  },
  chevronRow: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
    color: colors.text.ghost,
    lineHeight: 20,
  },
});
