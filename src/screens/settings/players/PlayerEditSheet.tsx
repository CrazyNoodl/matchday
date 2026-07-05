import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet, TeamBadge } from '@/components';
import { Player, Team } from '@/store/types';
import { makeStyles } from './players.styles';

interface PlayerEditSheetProps {
  visible: boolean;
  onClose: () => void;
  editingPlayer: Player | null;
  teams: Team[];
  playerColors: string[];
  formName: string;
  onChangeName: (v: string) => void;
  formNick: string;
  onChangeNick: (v: string) => void;
  formTeam: string;
  onChangeTeam: (v: string) => void;
  formColor: string;
  onChangeColor: (v: string) => void;
  onSave: () => void;
}

export function PlayerEditSheet({
  visible,
  onClose,
  editingPlayer,
  teams,
  playerColors,
  formName,
  onChangeName,
  formNick,
  onChangeNick,
  formTeam,
  onChangeTeam,
  formColor,
  onChangeColor,
  onSave,
}: PlayerEditSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>
          {editingPlayer ? t('players.editTitle') : t('setup.newPlayer')}
        </Text>

        <BottomSheetScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('setup.form.name')}</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={onChangeName}
              placeholder={t('setup.form.playerNamePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('setup.form.nickname')}</Text>
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
            <Text style={styles.formLabel}>{t('setup.form.defaultTeam')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.teamPicker}
            >
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.code}
                  style={[
                    styles.teamPickItem,
                    formTeam === team.code && {
                      borderColor: team.color + '88',
                      backgroundColor: team.color + '22',
                    },
                  ]}
                  onPress={() => onChangeTeam(team.code)}
                  activeOpacity={0.8}
                >
                  <TeamBadge teamCode={team.code} size="md" />
                  <Text style={styles.teamPickName} numberOfLines={1}>
                    {team.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('setup.form.color')}</Text>
            <View style={styles.colorPicker}>
              {playerColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    formColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => onChangeColor(c)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </View>
        </BottomSheetScrollView>

        <View style={styles.sheetActions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !formName.trim() && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={!formName.trim()}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.saveBtnText, !formName.trim() && styles.saveBtnTextDisabled]}
            >
              {editingPlayer ? t('common.save').toUpperCase() : t('setup.addPlayerBtn')}
            </Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Sheet>
  );
}
