import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet } from '@/components/Sheet';
import { TeamPickerRow } from '@/components/TeamPickerRow';
import { type Player, type Team } from '@/store/types';
import { canSavePlayer } from '@/utils/playerForm';
import { makeStyles } from './PlayerEditSheet.styles';

interface PlayerEditSheetProps {
  visible: boolean;
  onClose: () => void;
  editingPlayer: Player | null;
  teams: Team[];
  players: Player[];
  formName: string;
  onChangeName: (v: string) => void;
  formNick: string;
  onChangeNick: (v: string) => void;
  formTeam: string;
  onChangeTeam: (v: string) => void;
  isDuplicateName: boolean;
  onSave: () => void;
}

// Shared by Settings → Players and the new-tournament Setup flow — one
// component/behavior for both create and edit, driven entirely by props.
export function PlayerEditSheet({
  visible,
  onClose,
  editingPlayer,
  teams,
  players,
  formName,
  onChangeName,
  formNick,
  onChangeNick,
  formTeam,
  onChangeTeam,
  isDuplicateName,
  onSave,
}: PlayerEditSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const isDisabled = !canSavePlayer(formName, formTeam, teams, players, editingPlayer?.id);

  return (
    <Sheet visible={visible} onClose={onClose} avoidKeyboard>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>
          {editingPlayer
            ? t('players.editTitle').toUpperCase()
            : t('setup.newPlayer').toUpperCase()}
        </Text>

        <BottomSheetScrollView
          style={{ maxHeight: 360 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('setup.form.name').toUpperCase()}</Text>
            <TextInput
              testID="player-edit-name-input"
              style={styles.input}
              value={formName}
              onChangeText={onChangeName}
              placeholder={t('setup.form.playerNamePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
            />
            {isDuplicateName && (
              <Text style={styles.errorText}>{t('players.duplicateName')}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('setup.form.nickname').toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              value={formNick}
              onChangeText={onChangeNick}
              placeholder={t('setup.form.nicknamePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('setup.form.defaultTeam').toUpperCase()}</Text>
            {teams.length > 0 ? (
              <TeamPickerRow teams={teams} selectedCode={formTeam} onSelect={onChangeTeam} />
            ) : (
              <Text style={styles.errorText}>{t('players.teamRequired')}</Text>
            )}
          </View>
        </BottomSheetScrollView>

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.cancelBtnText}>{t('common.cancel').toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="player-edit-save-button"
            style={[styles.saveBtn, isDisabled && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={isDisabled}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnText, isDisabled && styles.saveBtnTextDisabled]}>
              {editingPlayer
                ? t('common.save').toUpperCase()
                : t('setup.addPlayerBtn').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Sheet>
  );
}
