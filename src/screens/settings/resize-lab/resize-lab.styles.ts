import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

const THUMB_SIZE = 96;

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
    },

    pickBtn: {
      height: 50,
      borderRadius: Radius.md,
      backgroundColor: colors.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    pickBtnText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.bg.base,
    },

    originalCard: {
      flexDirection: 'row',
      gap: Spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      marginBottom: Spacing.xl,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: Radius.md,
      overflow: 'hidden',
      backgroundColor: colors.bg.media,
    },
    thumbImage: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
    },
    originalInfo: {
      flex: 1,
      justifyContent: 'center',
      gap: 2,
    },
    originalLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    originalName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
    },
    originalMeta: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },

    presetCard: {
      flexDirection: 'row',
      gap: Spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    presetInfo: {
      flex: 1,
      justifyContent: 'center',
      gap: 3,
    },
    presetName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
    },
    presetTarget: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
    },
    presetMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: 2,
    },
    presetMeta: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    reductionBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    reductionBadgeGood: {
      backgroundColor: 'rgba(74,222,128,0.12)',
      borderColor: 'rgba(74,222,128,0.3)',
    },
    reductionBadgeBad: {
      backgroundColor: 'rgba(255,93,90,0.12)',
      borderColor: 'rgba(255,93,90,0.3)',
    },
    reductionBadgeTextGood: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 10,
      color: '#4ade80',
    },
    reductionBadgeTextBad: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 10,
      color: colors.accent.red,
    },
    errorText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.accent.red,
    },
    emptyHint: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.placeholder,
      textAlign: 'center',
      marginTop: Spacing.xl * 2,
    },
  });
