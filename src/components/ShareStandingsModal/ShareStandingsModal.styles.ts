import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const CARD_W = 320;

export const makeCardStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      width: CARD_W,
      backgroundColor: colors.bg.base,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    glow: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      top: 30,
      left: CARD_W / 2 - 130,
      opacity: 0.1,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    appName: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.sm,
      color: colors.text.placeholder,
      letterSpacing: 2.5,
    },
    topDate: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.default,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      gap: Spacing.xs,
    },
    tourName: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    tourSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
    },
    section: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: Spacing.sm,
    },
    headerCell: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 9,
      color: colors.text.placeholder,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      marginHorizontal: -Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.sm,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    rowLeader: {
      backgroundColor: colors.accent.greenSubtle,
    },
    playerCol: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    playerNames: {
      flexShrink: 1,
    },
    playerName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.xs,
      color: colors.text.primary,
    },
    playerNick: {
      fontFamily: FontFamily.body,
      fontSize: 10,
      color: colors.text.placeholder,
    },
    numCol: {
      width: 24,
      textAlign: 'center',
    },
    cell: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.secondary,
    },
    pts: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.sm,
      color: colors.accent.green,
    },
    roundsTitle: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 9,
      color: colors.text.placeholder,
      letterSpacing: 0.5,
      paddingBottom: Spacing.sm,
    },
    roundRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    // Left/right take equal flex share so the (optional) center badge lands
    // truly centered regardless of how wide the winner name or date text is.
    roundLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    roundCenter: {
      flexShrink: 0,
      alignItems: 'center',
      paddingHorizontal: Spacing.xs,
    },
    roundRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
    },
    roundBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    roundBadgeText: {
      fontFamily: FontFamily.displayBold,
      fontSize: 10,
      color: colors.text.secondary,
    },
    roundInfo: {
      flexShrink: 0,
      gap: 1,
    },
    roundDate: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: 10,
      color: colors.text.secondary,
    },
    roundMatchCount: {
      fontFamily: FontFamily.body,
      fontSize: 9,
      color: colors.text.muted,
    },
    roundWinnerName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.xs,
      color: colors.text.primary,
      flexShrink: 1,
    },
    friendlyBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.xs,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    friendlyBadgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 8,
      color: colors.text.muted,
      letterSpacing: 0.4,
    },
  });

export const makeModalStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    title: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      letterSpacing: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.lg,
      color: colors.text.muted,
    },
    previewScroll: {
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      backgroundColor: colors.bg.base,
    },
    cardWrap: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 12,
    },
    optionsWrap: {
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    saveBtn: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.strong,
    },
    shareBtn: {
      backgroundColor: colors.accent.green,
    },
    actionText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    saveMsg: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.sm,
    },
    saveMsgOk: {
      color: colors.accent.green,
    },
    saveMsgErr: {
      color: colors.accent.red,
    },
  });
