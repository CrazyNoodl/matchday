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
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: 36,
    color: Colors.text.primary,
    letterSpacing: 4,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 1.5,
    marginBottom: -Spacing.xs / 2,
  },
  input: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  btn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.bg.base,
    letterSpacing: 1.5,
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  toggleText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
  },
  errorBox: {
    backgroundColor: '#3a1a1a',
    borderWidth: 1,
    borderColor: '#ff453a44',
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: '#ff453a',
  },
  successBox: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: Colors.accent.green + '44',
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  successText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
  },
});
