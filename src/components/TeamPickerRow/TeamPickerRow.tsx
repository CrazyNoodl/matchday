import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { TeamBadge } from '@/components/TeamBadge';
import { type Team } from '@/store/types';
import { makeStyles } from './TeamPickerRow.styles';
import { useColors } from '@/theme';

interface TeamPickerRowProps {
  teams: Team[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export function TeamPickerRow({ teams, selectedCode, onSelect }: TeamPickerRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
      {teams.map((t) => (
        <TouchableOpacity
          key={t.code}
          testID={`team-picker-item-${t.short}`}
          style={[
            styles.item,
            selectedCode === t.code && {
              borderColor: t.color + '88',
              backgroundColor: t.color + '22',
            },
          ]}
          onPress={() => onSelect(t.code)}
          activeOpacity={0.8}
        >
          <TeamBadge teamCode={t.code} size="md" />
          <Text style={styles.name} numberOfLines={1}>
            {t.short}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
