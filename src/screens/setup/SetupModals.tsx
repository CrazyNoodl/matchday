import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { TeamBadge } from '@/components';
import { type Team } from '@/store/types';
import { makeStyles } from './setup.styles';

// ---------------------------------------------------------------------------
// Add player sheet
// ---------------------------------------------------------------------------

interface AddPlayerSheetProps {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
  name: string;
  onChangeName: (v: string) => void;
  nick: string;
  onChangeNick: (v: string) => void;
  teamCode: string;
  onChangeTeamCode: (v: string) => void;
  onSubmit: () => void;
}

export function AddPlayerSheet({
  visible,
  onClose,
  teams,
  name,
  onChangeName,
  nick,
  onChangeNick,
  teamCode,
  onChangeTeamCode,
  onSubmit,
}: AddPlayerSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, styles.sheetTall]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{t('setup.newPlayer').toUpperCase()}</Text>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.addPlayerFormGroup}>
            <Text style={styles.addPlayerFormLabel}>{t('setup.form.name').toUpperCase()}</Text>
            <TextInput
              style={styles.addPlayerInput}
              value={name}
              onChangeText={onChangeName}
              placeholder={t('setup.form.playerNamePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoFocus
              autoCorrect={false}
            />
          </View>
          <View style={styles.addPlayerFormGroup}>
            <Text style={styles.addPlayerFormLabel}>{t('setup.form.nickname').toUpperCase()}</Text>
            <TextInput
              style={styles.addPlayerInput}
              value={nick}
              onChangeText={onChangeNick}
              placeholder={t('setup.form.nicknamePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
            />
          </View>
          <View style={styles.addPlayerFormGroup}>
            <Text style={styles.addPlayerFormLabel}>
              {t('setup.form.defaultTeam').toUpperCase()}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.addPlayerTeamPicker}
            >
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.code}
                  style={[
                    styles.addPlayerTeamItem,
                    teamCode === team.code && {
                      borderColor: team.color + '88',
                      backgroundColor: team.color + '22',
                    },
                  ]}
                  onPress={() => onChangeTeamCode(team.code)}
                  activeOpacity={0.8}
                >
                  <TeamBadge teamCode={team.code} size="md" />
                  <Text style={styles.addPlayerTeamName} numberOfLines={1}>
                    {team.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
        <View style={styles.addPlayerActions}>
          <TouchableOpacity
            style={styles.addPlayerCancelBtn}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <Text style={styles.addPlayerCancelText}>{t('common.cancel').toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.doneBtn,
              { flex: 2, marginTop: 0 },
              !name.trim() && styles.doneBtnDisabled,
            ]}
            onPress={onSubmit}
            disabled={!name.trim()}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, !name.trim() && styles.doneBtnTextDisabled]}>
              {t('setup.addPlayerBtn').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Assign team sheet
// ---------------------------------------------------------------------------

interface AssignTeamSheetProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  teams: Team[];
  currentTeamCode: string;
  onSelectTeam: (code: string) => void;
}

export function AssignTeamSheet({
  visible,
  onClose,
  playerName,
  teams,
  currentTeamCode,
  onSelectTeam,
}: AssignTeamSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>
          {t('setup.teamFor', { name: playerName.toUpperCase() })}
        </Text>
        <FlatList
          data={teams}
          numColumns={2}
          keyExtractor={(team) => team.code}
          columnWrapperStyle={styles.teamGrid}
          style={styles.teamGridList}
          renderItem={({ item }) => {
            const isActive = item.code === currentTeamCode;
            return (
              <TouchableOpacity
                style={[
                  styles.teamGridItem,
                  isActive && {
                    borderColor: item.color + '88',
                    backgroundColor: item.color + '18',
                  },
                ]}
                onPress={() => onSelectTeam(item.code)}
                activeOpacity={0.8}
              >
                <TeamBadge teamCode={item.code} size="lg" />
                <Text style={styles.teamGridName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.teamGridCode}>{item.short}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>{t('common.done').toUpperCase()}</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Manage teams sheet
// ---------------------------------------------------------------------------

interface ManageTeamsSheetProps {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
  newTeamName: string;
  onChangeNewTeamName: (v: string) => void;
  onAddTeam: () => void;
  onDeleteTeam: (code: string) => void;
}

export function ManageTeamsSheet({
  visible,
  onClose,
  teams,
  newTeamName,
  onChangeNewTeamName,
  onAddTeam,
  onDeleteTeam,
}: ManageTeamsSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, styles.sheetTall]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{t('setup.manageTeamsTitle').toUpperCase()}</Text>
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {teams.map((team) => (
            <View key={team.code} style={styles.teamListRow}>
              <TeamBadge teamCode={team.code} size="md" />
              <View style={styles.flex}>
                <Text style={styles.teamListName}>{team.name}</Text>
                <Text style={styles.teamListCode}>{team.short}</Text>
              </View>
              {team.custom && (
                <TouchableOpacity
                  style={styles.removeTeamBtn}
                  onPress={() => onDeleteTeam(team.code)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeTeamIcon}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add team input */}
          <View style={styles.addTeamRow}>
            <TextInput
              style={styles.addTeamInput}
              value={newTeamName}
              onChangeText={onChangeNewTeamName}
              placeholder={t('setup.teamNamePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              returnKeyType="done"
              onSubmitEditing={onAddTeam}
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.addTeamBtn, !newTeamName.trim() && styles.addTeamBtnDisabled]}
              onPress={onAddTeam}
              disabled={!newTeamName.trim()}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.addTeamBtnText,
                  !newTeamName.trim() && styles.addTeamBtnTextDisabled,
                ]}
              >
                {t('common.add').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
        <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>{t('common.done').toUpperCase()}</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Modal>
  );
}
