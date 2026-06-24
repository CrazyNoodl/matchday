import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardLeader: {
    borderColor: Colors.accent.greenBorder,
    backgroundColor: Colors.accent.greenSubtle,
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
    color: Colors.text.primary,
    flexShrink: 1,
  },
  leaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
  },
  leaderText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
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
    color: Colors.text.muted,
  },
  statDivider: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.ghost,
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
    color: Colors.accent.green,
    lineHeight: 34,
  },
  ptsLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
  },
});
