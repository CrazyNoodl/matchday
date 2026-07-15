import { StyleSheet, Dimensions } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const SCREEN_WIDTH = Dimensions.get('window').width;

// assets/onboarding-*.png are pre-cropped to this exact aspect ratio (Playwright
// `clip: { width: 420, height: 480 }` at capture time) — the Image just renders
// at native size, no runtime cropping needed.
export const SCREENSHOT_ASPECT_RATIO = 420 / 480;

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    skipRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      minHeight: 44,
    },
    slide: {
      width: SCREEN_WIDTH,
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
      paddingTop: Spacing.md,
      gap: Spacing.lg,
    },
    screenshotWrap: {
      width: '100%',
      aspectRatio: SCREENSHOT_ASPECT_RATIO,
      borderRadius: Radius['2xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border.medium,
      backgroundColor: colors.bg.surface,
    },
    screenshotImage: {
      width: '100%',
      height: '100%',
    },
    iconWrap: {
      width: '100%',
      aspectRatio: SCREENSHOT_ASPECT_RATIO,
      borderRadius: Radius['2xl'],
      borderWidth: 1,
      borderColor: colors.border.medium,
      backgroundColor: colors.bg.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 88,
    },
    toggleRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.medium,
      backgroundColor: colors.bg.surface,
    },
    toggleLabelBlock: {
      flex: 1,
      gap: Spacing.xs,
    },
    toggleLabel: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.md,
      color: colors.text.primary,
    },
    toggleHint: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },
    title: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    desc: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.md,
      color: colors.text.muted,
      textAlign: 'center',
      lineHeight: 22,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.bg.elevated,
    },
    dotActive: {
      width: 20,
      backgroundColor: colors.accent.green,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
    },
  });
