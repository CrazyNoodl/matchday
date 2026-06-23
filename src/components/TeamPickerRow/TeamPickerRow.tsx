import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { TeamBadge } from '@/components/TeamBadge';
import { Team } from '@/store/types';

interface TeamPickerRowProps {
  teams: Team[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export function TeamPickerRow({ teams, selectedCode, onSelect }: TeamPickerRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
      {teams.map((t) => (
        <TouchableOpacity
          key={t.code}
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
          <Text style={styles.name} numberOfLines={1}>{t.short}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexGrow: 0,
  },
  item: {
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
    width: 72,
  },
  name: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
