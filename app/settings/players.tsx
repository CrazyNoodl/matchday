import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { Avatar } from '@/components/Avatar';
import { TeamBadge } from '@/components/TeamBadge';
import { EmptyState } from '@/components/EmptyState';
import { Sheet } from '@/components/Sheet/Sheet';
import { GlowBackground } from '@/components/GlowBackground';
import { Player } from '@/store/types';
import { useTranslation } from 'react-i18next';

const PLAYER_COLORS = Colors.player;

export default function PlayersScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const store = useStore();
  const { players, teams, matches, archivedRounds, closedTournaments, addPlayer, updatePlayer, deletePlayer } = store;

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCannotDelete, setShowCannotDelete] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Edit form state
  const [formName, setFormName] = useState('');
  const [formNick, setFormNick] = useState('');
  const [formTeam, setFormTeam] = useState('');
  const [formColor, setFormColor] = useState<string>(PLAYER_COLORS[0]);

  const openCreate = useCallback(() => {
    setEditingPlayer(null);
    setFormName('');
    setFormNick('');
    setFormTeam(teams[0]?.code ?? '');
    setFormColor(PLAYER_COLORS[players.length % PLAYER_COLORS.length]);
    setShowEdit(true);
  }, [teams, players.length]);

  const openEdit = useCallback((player: Player) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormNick(player.nick ?? '');
    setFormTeam(player.teamCode);
    setFormColor(player.color);
    setShowEdit(true);
  }, []);

  const handleSave = useCallback(() => {
    const name = formName.trim();
    if (!name) return;

    if (editingPlayer) {
      updatePlayer({
        ...editingPlayer,
        name,
        nick: formNick.trim() || undefined,
        teamCode: formTeam,
        color: formColor,
      });
    } else {
      addPlayer({
        id: `player-${Date.now()}`,
        name,
        nick: formNick.trim() || undefined,
        teamCode: formTeam,
        color: formColor,
      });
    }
    setShowEdit(false);
  }, [formName, formNick, formTeam, formColor, editingPlayer, addPlayer, updatePlayer]);

  const handleDelete = useCallback((id: string) => {
    const allMatches = [
      ...matches,
      ...archivedRounds.flatMap((r) => r.matches),
      ...closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
    ];
    if (allMatches.some((m) => m.aId === id || m.bId === id)) {
      setShowCannotDelete(true);
      return;
    }
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  }, [matches, archivedRounds, closedTournaments, store]);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deletePlayer(pendingDeleteId);
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  }, [pendingDeleteId, deletePlayer]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader
        title={t('players.title')}
        subtitle={t('settings.data.playersCount', { count: players.length })}
        onBack={() => goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={openCreate}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>{'+ ' + t('common.add')}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {players.length === 0 ? (
          <EmptyState
            message={t('players.noResults')}
            ctaText={t('players.noResultsAction')}
            onPress={openCreate}
          />
        ) : (
          players.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <Avatar playerId={player.id} size="md" />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.nick && (
                  <Text style={styles.playerNick}>@{player.nick}</Text>
                )}
              </View>
              <View style={styles.playerActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openEdit(player)}
                  activeOpacity={0.75}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(player.id)}
                  activeOpacity={0.75}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteIcon}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit / Create Sheet */}
      <Sheet visible={showEdit} onClose={() => setShowEdit(false)}>
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
                onChangeText={setFormName}
                placeholder={t('setup.form.playerNamePlaceholder')}
                placeholderTextColor={Colors.text.placeholder}
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('setup.form.nickname')}</Text>
              <TextInput
                style={styles.input}
                value={formNick}
                onChangeText={setFormNick}
                placeholder={t('setup.form.nicknamePlaceholder')}
                placeholderTextColor={Colors.text.placeholder}
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
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.code}
                    style={[
                      styles.teamPickItem,
                      formTeam === t.code && {
                        borderColor: t.color + '88',
                        backgroundColor: t.color + '22',
                      },
                    ]}
                    onPress={() => setFormTeam(t.code)}
                    activeOpacity={0.8}
                  >
                    <TeamBadge teamCode={t.code} size="md" />
                    <Text style={styles.teamPickName} numberOfLines={1}>
                      {t.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('setup.form.color')}</Text>
              <View style={styles.colorPicker}>
                {PLAYER_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      formColor === c && styles.colorDotSelected,
                    ]}
                    onPress={() => setFormColor(c)}
                    activeOpacity={0.8}
                  />
                ))}
              </View>
            </View>
          </BottomSheetScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowEdit(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !formName.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
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

      {/* Cannot delete dialog */}
      <Modal
        visible={showCannotDelete}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowCannotDelete(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>CANNOT DELETE</Text>
            <Text style={styles.dialogDesc}>
              {t('players.cannotDelete')}
            </Text>
            <TouchableOpacity
              style={[styles.dialogConfirm, { width: '100%' }]}
              onPress={() => setShowCannotDelete(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.dialogConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete confirm dialog */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('players.deleteConfirm').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('players.deleteDesc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancel}
                onPress={() => setShowDeleteConfirm(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={confirmDelete}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.base },
  addBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
  },
  addBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  playerNick: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  playerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  deleteBtn: {
    backgroundColor: Colors.accent.redSubtle,
    borderColor: Colors.accent.red + '44',
  },
  editIcon: {
    fontSize: 14,
  },
  deleteIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xl,
    color: Colors.accent.red,
    lineHeight: 22,
  },
  // Sheet
  sheet: {
    backgroundColor: Colors.bg.sheet,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing['2xl'],
  },
  sheetTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  formGroup: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  teamPicker: { flexGrow: 0 },
  teamPickItem: {
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
  teamPickName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  cancelBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  saveBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.greenDark,
    letterSpacing: 0.5,
  },
  saveBtnTextDisabled: {
    color: Colors.text.ghost,
  },
  // Dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  dialog: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border.medium,
    padding: Spacing['2xl'],
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dialogTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  dialogCancel: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  dialogCancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  dialogConfirm: {
    flex: 1,
    backgroundColor: Colors.accent.red,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
