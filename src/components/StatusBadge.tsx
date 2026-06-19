import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius } from '../theme/spacing';

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

const CONFIG: Record<BadgeType, BadgeConfig> = {
  live: {
    label: 'LIVE',
    bg: Colors.accent.greenSubtle,
    textColor: Colors.accent.green,
    borderColor: Colors.accent.greenBorder,
  },
  soon: {
    label: 'SOON',
    bg: Colors.accent.blueSubtle,
    textColor: Colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  leader: {
    label: 'LEADER',
    bg: Colors.accent.greenSubtle,
    textColor: Colors.accent.green,
    borderColor: Colors.accent.greenBorder,
  },
  editing: {
    label: 'EDITING',
    bg: Colors.accent.blueSubtle,
    textColor: Colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  archived: {
    label: 'ARCHIVED',
    bg: 'rgba(255,255,255,0.05)',
    textColor: Colors.text.muted,
    borderColor: Colors.border.default,
  },
  friendly: {
    label: 'FRIENDLY',
    bg: Colors.accent.blueSubtle,
    textColor: Colors.accent.blue,
    borderColor: 'rgba(106,166,255,0.28)',
  },
  auto: {
    label: 'AUTO',
    bg: 'rgba(255,255,255,0.05)',
    textColor: Colors.text.muted,
    borderColor: Colors.border.default,
  },
  ranked: {
    label: 'RANKED',
    bg: Colors.accent.greenSubtle,
    textColor: Colors.accent.green,
    borderColor: Colors.accent.greenBorder,
  },
};

export function StatusBadge({ type }: StatusBadgeProps) {
  const cfg = CONFIG[type];

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
