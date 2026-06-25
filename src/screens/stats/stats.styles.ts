import { StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  chevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.text.secondary,
    lineHeight: 28,
    marginTop: -2,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: Colors.text.primary,
    letterSpacing: 0.5,
    lineHeight: 34,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },

  tabRow: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },

  tabContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },

  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  statTileLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statTileValue: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
  },
  statTileValueGreen: {
    color: Colors.accent.green,
  },

  h2hCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  h2hTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  h2hPlayerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  h2hPlayerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  h2hPlayerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  h2hGamesWrap: {
    paddingHorizontal: Spacing.sm,
  },
  h2hGamesText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  h2hScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h2hWinsCount: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    lineHeight: 28,
  },
  h2hDrawsLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    flex: 1,
    textAlign: 'center',
  },
  h2hBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    alignItems: 'center',
  },
  h2hBarSegment: {
    height: 6,
  },
  h2hBarGap: {
    width: 3,
    height: 6,
    backgroundColor: Colors.bg.base,
  },
  h2hGoals: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },

  emptyWrap: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.placeholder,
  },
});
