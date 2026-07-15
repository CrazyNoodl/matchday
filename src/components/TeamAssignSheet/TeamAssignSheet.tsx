import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet } from '@/components/Sheet';
import { TeamPickerRow } from '@/components/TeamPickerRow';
import { type Team } from '@/store/types';
import { makeStyles } from './TeamAssignSheet.styles';

interface TeamAssignSheetProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  teams: Team[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

// Compact picker for changing a player's team in place, without opening the
// full PlayerEditSheet — e.g. tapping the team badge in the Setup player list.
export function TeamAssignSheet({
  visible,
  onClose,
  playerName,
  teams,
  selectedCode,
  onSelect,
}: TeamAssignSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>
          {t('setup.changeTeamFor', { name: playerName }).toUpperCase()}
        </Text>
        <TeamPickerRow teams={teams} selectedCode={selectedCode} onSelect={onSelect} />
      </View>
    </Sheet>
  );
}
