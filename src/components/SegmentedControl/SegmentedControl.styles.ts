import { StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const styles = StyleSheet.create({
  trackBoxed: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segBoxed: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm - 1,
    borderRadius: Radius.md,
  },
  segBoxedActive: {
    backgroundColor: Colors.bg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  textBoxed: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  textBoxedActive: {
    color: Colors.text.primary,
  },

  trackPill: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full,
    padding: 3,
    gap: 3,
  },
  segPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segPillActive: {
    backgroundColor: Colors.accent.green,
  },
  textPill: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    letterSpacing: 0.2,
  },
  textPillActive: {
    color: Colors.accent.greenDark,
  },
  textPillInactive: {
    color: Colors.text.muted,
  },
});
