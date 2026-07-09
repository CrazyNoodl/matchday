import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet, TeamBadge } from '@/components';
import { type Player, type Team } from '@/store/types';
import { makeStyles } from './players.styles';

interface PlayerEditSheetProps {
  visible: boolean;
  onClose: () => void;
  editingPlayer: Player | null;
  teams: Team[];
  formName: string;
  onChangeName: (v: string) => void;
  formNick: string;
  onChangeNick: (v: string) => void;
  formTeam: string;
  onChangeTeam: (v: string) => void;
  onSave: () => void;
}

export function PlayerEditSheet({
  visible,
  onClose,
  editingPlayer,
  teams,
  formName,
  onChangeName,
  formNick,
  onChangeNick,
  formTeam,
  onChangeTeam,
  onSave,
}: PlayerEditSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Sheet visible={visible} onClose={onClose}>
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
              style={styles.input}
              value={formName}
              onChangeText={onChangeName}
              placeholder={t('setup.form.playerNamePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
            />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamPicker}>
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
        </BottomSheetScrollView>

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.cancelBtnText}>{t('common.cancel').toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !formName.trim() && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={!formName.trim()}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnText, !formName.trim() && styles.saveBtnTextDisabled]}>
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
