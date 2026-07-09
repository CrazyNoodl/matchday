import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

const THUMB_SIZE = 88;

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

    proxyHint: {
      backgroundColor: 'rgba(106,166,255,0.1)',
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: 'rgba(106,166,255,0.2)',
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    proxyHintText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.accent.blue,
      lineHeight: 18,
    },
    proxyHintCode: {
      fontFamily: FontFamily.bodyBold,
    },

    // Thumbnails row
    thumbsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: Radius.md,
      overflow: 'hidden',
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    thumbImage: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
    },
    thumbRemove: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbRemoveText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 15,
      color: '#fff',
      lineHeight: 17,
    },
    thumbAdd: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border.strong,
      backgroundColor: colors.bg.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    thumbAddIcon: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.muted,
      lineHeight: 28,
    },
    thumbAddLabel: {
      fontFamily: FontFamily.body,
      fontSize: 10,
      color: colors.text.placeholder,
    },
    photoCount: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
      marginBottom: Spacing.lg,
    },

    // Scan button
    scanBtn: {
      height: 50,
      borderRadius: Radius.md,
      backgroundColor: colors.accent.blue,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    scanBtnDisabled: {
      opacity: 0.35,
    },
    scanBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    scanBtnText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.bg.base,
    },

    // Error
    errorCard: {
      backgroundColor: colors.accent.redSubtle,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: 'rgba(255,93,90,0.22)',
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      gap: 4,
    },
    errorTitle: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.accent.red,
    },
    errorText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },

    // Results
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    resultMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    resultMetaText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    metaBadgeLow: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: Radius.full,
      borderWidth: 1,
      backgroundColor: 'rgba(255,160,50,0.12)',
      borderColor: 'rgba(255,160,50,0.3)',
    },
    metaBadgeLowText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 10,
      color: '#ffa032',
    },

    statsCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    statRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    confStripe: {
      width: 3,
    },
    statContent: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
    },

    legend: {
      gap: 6,
      paddingHorizontal: Spacing.xs,
      marginBottom: Spacing.xl,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    legendStripe: {
      width: 3,
      height: 14,
      borderRadius: 2,
    },
    legendText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
  });
