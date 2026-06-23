import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { Avatar } from '@/components/Avatar';

export interface RankMedal {
  badgeColor: string;
  badgeBg: string;
  cardBorder: string;
}

interface PlayerRankCardProps {
  rank: number;
  medal: RankMedal | null;
  playerId: string;
  name: string;
  subText: string;
  points: number;
  pointsLabel: string;
  pointsColor?: string;
  /** Highlights the card with a subtle green background (e.g. the #1 row). */
  emphasized?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PlayerRankCard({
  rank,
  medal,
  playerId,
  name,
  subText,
  points,
  pointsLabel,
  pointsColor,
  emphasized,
  style,
}: PlayerRankCardProps) {
  return (
    <View
      style={[
        styles.card,
        { borderColor: medal ? medal.cardBorder : Colors.border.default },
        emphasized && styles.cardEmphasized,
        style,
      ]}
    >
      <View
        style={[
          styles.medalBadge,
          { backgroundColor: medal ? medal.badgeBg : 'rgba(255,255,255,0.06)' },
        ]}
      >
        <Text style={[styles.medalText, { color: medal ? medal.badgeColor : Colors.text.muted }]}>
          {rank}
        </Text>
      </View>

      <View style={styles.info}>
        <Avatar playerId={playerId} size="md" />
        <View style={styles.nameWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.subText} numberOfLines={1}>
            {subText}
          </Text>
        </View>
      </View>

      <View style={styles.ptsBlock}>
        <Text style={[styles.ptsNumber, pointsColor ? { color: pointsColor } : null]}>
          {points}
        </Text>
        <Text style={styles.ptsLabel}>{pointsLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardEmphasized: {
    backgroundColor: Colors.accent.greenSubtle,
  },
  medalBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medalText: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.md,
    lineHeight: 18,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    overflow: 'hidden',
  },
  nameWrap: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  subText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  ptsBlock: {
    alignItems: 'center',
    minWidth: 40,
    flexShrink: 0,
  },
  ptsNumber: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['3xl'],
    color: Colors.text.primary,
    lineHeight: 34,
  },
  ptsLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.8,
    marginTop: -2,
  },
});
