import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius } from '../../theme/spacing';
import type { BadgeType } from './StatusBadge';

interface BadgeConfig {
  bg: string;
  textColor: string;
  borderColor?: string;
}

export const makeConfig = (colors: AppColors): Record<BadgeType, BadgeConfig> => ({
  live: {
    bg: colors.accent.greenSubtle,
    textColor: colors.accent.green,
    borderColor: colors.accent.greenBorder,
  },
  soon: {
    bg: colors.accent.blueSubtle,
    textColor: colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  leader: {
    bg: colors.accent.greenSubtle,
    textColor: colors.accent.green,
    borderColor: colors.accent.greenBorder,
  },
  editing: {
    bg: colors.accent.blueSubtle,
    textColor: colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  archived: {
    bg: colors.bg.elevated,
    textColor: colors.text.muted,
    borderColor: colors.border.default,
  },
  friendly: {
    bg: colors.accent.blueSubtle,
    textColor: colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  auto: {
    bg: colors.bg.elevated,
    textColor: colors.text.muted,
    borderColor: colors.border.default,
  },
  ranked: {
    bg: colors.accent.greenSubtle,
    textColor: colors.accent.green,
    borderColor: colors.accent.greenBorder,
  },
});

export const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
  },
});
