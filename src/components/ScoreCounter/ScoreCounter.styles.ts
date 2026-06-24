import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  score: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.score,
    color: Colors.accent.green,
    lineHeight: FontSize.score + 8,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    lineHeight: 28,
    textAlign: 'center',
  },
  btnTextDisabled: {
    color: Colors.text.muted,
  },
});
