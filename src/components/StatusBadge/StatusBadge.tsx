import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../theme';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius } from '../../theme/spacing';

type BadgeType =
  | 'live'
  | 'soon'
  | 'leader'
  | 'editing'
  | 'archived'
  | 'friendly'
  | 'auto'
  | 'ranked';

interface StatusBadgeProps {
  type: BadgeType;
}

interface BadgeConfig {
  label: string;
  bg: string;
  textColor: string;
  borderColor?: string;
}

const makeConfig = (colors: AppColors): Record<BadgeType, BadgeConfig> => ({
  live: {
    label: 'LIVE',
    bg: colors.accent.greenSubtle,
    textColor: colors.accent.green,
    borderColor: colors.accent.greenBorder,
  },
  soon: {
    label: 'SOON',
    bg: colors.accent.blueSubtle,
    textColor: colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  leader: {
    label: 'LEADER',
    bg: colors.accent.greenSubtle,
    textColor: colors.accent.green,
    borderColor: colors.accent.greenBorder,
  },
  editing: {
    label: 'EDITING',
    bg: colors.accent.blueSubtle,
    textColor: colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  archived: {
    label: 'ARCHIVED',
    bg: 'rgba(255,255,255,0.05)',
    textColor: colors.text.muted,
    borderColor: colors.border.default,
  },
  friendly: {
    label: 'FRIENDLY',
    bg: colors.accent.blueSubtle,
    textColor: colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  auto: {
    label: 'AUTO',
    bg: 'rgba(255,255,255,0.05)',
    textColor: colors.text.muted,
    borderColor: colors.border.default,
  },
  ranked: {
    label: 'RANKED',
    bg: colors.accent.greenSubtle,
    textColor: colors.accent.green,
    borderColor: colors.accent.greenBorder,
  },
});

export function StatusBadge({ type }: StatusBadgeProps) {
  const colors = useColors();
  const cfg = makeConfig(colors)[type];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.borderColor ?? 'transparent',
        },
      ]}
    >
      <Text style={[styles.label, { color: cfg.textColor }]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
