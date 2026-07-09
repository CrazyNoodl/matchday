import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../theme';
import { makeConfig, styles } from './StatusBadge.styles';

export type BadgeType =
  'live' | 'soon' | 'leader' | 'editing' | 'archived' | 'friendly' | 'auto' | 'ranked';

interface StatusBadgeProps {
  type: BadgeType;
}

const LABEL_KEYS: Record<BadgeType, string> = {
  live: 'archive.live',
  soon: 'common.soon',
  leader: 'common.leader',
  editing: 'common.editing',
  archived: 'common.archived',
  friendly: 'common.friendly',
  auto: 'common.auto',
  ranked: 'common.ranked',
};

export const StatusBadge = React.memo(function StatusBadge({ type }: StatusBadgeProps) {
  const { t } = useTranslation();
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
        {t(LABEL_KEYS[type]).toUpperCase()}
      </Text>
    </View>
  );
});
