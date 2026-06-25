import { StyleSheet } from 'react-native';
import { Colors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';

// Both blocks below use fixed colors regardless of color scheme: errorStyles
// renders before ThemeProvider context can be trusted, bannerStyles is
// intentionally yellow-themed regardless of light/dark mode.
export const errorStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  btn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.accent.green + '22',
    borderWidth: 1,
    borderColor: Colors.accent.green + '55',
  },
  btnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
    letterSpacing: 1.2,
  },
});

export const bannerStyles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
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
