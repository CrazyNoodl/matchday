import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardLeader: {
    borderColor: colors.accent.greenBorder,
    backgroundColor: colors.accent.greenSubtle,
  },
  position: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    width: 24,
    textAlign: 'center',
  },
  avatar: {
    // no extra style needed; gap handles spacing
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: colors.text.primary,
    flexShrink: 1,
  },
  leaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
  },
  leaderText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  statDivider: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.ghost,
  },
  chips: {
    flexDirection: 'row',
    gap: 3,
  },
  ptsBlock: {
    alignItems: 'center',
    minWidth: 42,
  },
  pts: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: colors.accent.green,
    lineHeight: 34,
  },
  ptsLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.6,
  },
});
