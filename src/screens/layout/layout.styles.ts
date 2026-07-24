import { StyleSheet } from 'react-native';
import { Colors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

// Both blocks below use fixed colors regardless of color scheme — intentionally
// yellow/blue-themed regardless of light/dark mode.
export const offlineBannerStyles = StyleSheet.create({
  root: {
    marginTop: Spacing.md,
    backgroundColor: '#15181b',
    borderTopWidth: 1,
    borderTopColor: Colors.accent.blue + '55',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: Colors.accent.blue,
    letterSpacing: 1.2,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.accent.blue + 'aa',
    marginTop: 1,
  },
});

export const bannerStyles = StyleSheet.create({
  root: {
    marginTop: Spacing.md,
    backgroundColor: '#2a1f00',
    borderTopWidth: 1,
    borderTopColor: Colors.accent.yellow + '55',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: Colors.accent.yellow,
    letterSpacing: 1.2,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.accent.yellow + 'aa',
    marginTop: 1,
  },
  textBlock: {
    flex: 1,
    marginRight: Spacing.md,
  },
  note: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.accent.yellow + '88',
    marginTop: 4,
  },
  exitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.accent.yellow + '22',
    borderWidth: 1,
    borderColor: Colors.accent.yellow + '55',
  },
  exitText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.accent.yellow,
    letterSpacing: 0.8,
  },
});
