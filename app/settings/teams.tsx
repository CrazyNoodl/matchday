import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { TeamBadge } from '@/components/TeamBadge';
import { EmptyState } from '@/components/EmptyState';
import { Team } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { uploadTeamLogo } from '@/supabase/storage';

const TEAM_COLORS = Colors.team;

export default function TeamsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const store = useStore();
  const { teams, matches, archivedRounds, closedTournaments, addTeam, updateTeam, deleteTeam } = store;

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCannotDelete, setShowCannotDelete] = useState(false);
  const [pendingDeleteCode, setPendingDeleteCode] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formShort, setFormShort] = useState('');
  const [formColor, setFormColor] = useState<string>(TEAM_COLORS[0]);
  const [formLogo, setFormLogo] = useState<string | undefined>(undefined);
  const [logoUploading, setLogoUploading] = useState(false);
  // Bumped every time a different team's edit form is opened, so an
  // in-flight upload from a form the user already left can't write its
  // result into whichever form happens to be open when it resolves.
  const editSessionRef = useRef(0);

  const openCreate = useCallback(() => {
    editSessionRef.current += 1;
    setEditingTeam(null);
    setFormName('');
    setFormShort('');
    setFormColor(TEAM_COLORS[teams.length % TEAM_COLORS.length]);
    setFormLogo(undefined);
    setLogoUploading(false);
    setShowEdit(true);
  }, [teams.length]);

  const openEdit = useCallback((team: Team) => {
    editSessionRef.current += 1;
    setEditingTeam(team);
    setFormName(team.name);
    setFormShort(team.short);
    setFormColor(team.color);
    setFormLogo(team.logo);
    setLogoUploading(false);
    setShowEdit(true);
  }, []);

  const pickLogo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const session = editSessionRef.current;
    const localUri = result.assets[0].uri;
    setFormLogo(localUri);
    setLogoUploading(true);
    const remoteUrl = await uploadTeamLogo(localUri);
    if (editSessionRef.current !== session) return; // user moved to a different team's form
    setLogoUploading(false);
    // Local file:// URIs aren't visible to other devices and aren't
    // guaranteed to survive app restarts — only keep the remote URL.
    if (remoteUrl) setFormLogo(remoteUrl);
  }, []);

  const handleSave = useCallback(() => {
    const name = formName.trim();
    const short = formShort.trim().toUpperCase().slice(0, 3);
    if (!name || !short) return;

    if (editingTeam) {
      updateTeam({ ...editingTeam, name, short, color: formColor, logo: formLogo });
    } else {
      const code = short + Date.now().toString(36).slice(-3).toUpperCase();
      addTeam({
        code,
        name,
        short,
        color: formColor,
        custom: true,
        logo: formLogo,
      });
    }
    setShowEdit(false);
  }, [formName, formShort, formColor, formLogo, editingTeam, addTeam, updateTeam]);

  const handleDelete = useCallback((code: string) => {
    const allMatches = [
      ...matches,
      ...archivedRounds.flatMap((r) => r.matches),
      ...closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
    ];
    if (allMatches.some((m) => m.aTeam === code || m.bTeam === code)) {
      setShowCannotDelete(true);
      return;
    }
    setPendingDeleteCode(code);
    setShowDeleteConfirm(true);
  }, [matches, archivedRounds, closedTournaments, store]);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteCode) {
      deleteTeam(pendingDeleteCode);
    }
    setShowDeleteConfirm(false);
    setPendingDeleteCode(null);
  }, [pendingDeleteCode, deleteTeam]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />
      <NavHeader
        title={t('teams.title')}
        subtitle={t('settings.data.teamsCount', { count: teams.length })}
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
        {teams.length === 0 ? (
          <EmptyState
            message={t('teams.noResults')}
            ctaText={t('teams.noResultsAction')}
            onPress={openCreate}
          />
        ) : (
          teams.map((team) => (
            <View key={team.code} style={styles.teamRow}>
              <TeamBadge teamCode={team.code} size="lg" />
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamCode}>{team.short}</Text>
              </View>
              <View style={styles.teamActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openEdit(team)}
                  activeOpacity={0.75}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(team.code)}
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
      <Modal
        visible={showEdit}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowEdit(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowEdit(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {editingTeam ? t('teams.editTitle') : 'NEW TEAM'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TEAM NAME</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Manchester City"
                placeholderTextColor={Colors.text.placeholder}
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>SHORT CODE (3 letters)</Text>
              <TextInput
                style={styles.input}
                value={formShort}
                onChangeText={(v) => setFormShort(v.slice(0, 3).toUpperCase())}
                placeholder="e.g. MCI"
                placeholderTextColor={Colors.text.placeholder}
                autoCorrect={false}
                autoCapitalize="characters"
                maxLength={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>LOGO (OPTIONAL)</Text>
              <View style={styles.logoRow}>
                <TouchableOpacity
                  style={styles.logoPickerBtn}
                  onPress={pickLogo}
                  activeOpacity={0.8}
                >
                  {formLogo ? (
                    <Image source={{ uri: formLogo }} style={styles.logoPreview} resizeMode="cover" />
                  ) : (
                    <Text style={styles.logoPickerIcon}>📷</Text>
                  )}
                </TouchableOpacity>
                {formLogo && (
                  <TouchableOpacity
                    style={styles.logoRemoveBtn}
                    onPress={() => setFormLogo(undefined)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.logoRemoveText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('setup.form.color')}</Text>
              <View style={styles.colorPicker}>
                {TEAM_COLORS.map((c) => (
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
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowEdit(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!formName.trim() || !formShort.trim() || logoUploading) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!formName.trim() || !formShort.trim() || logoUploading}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.saveBtnText,
                  (!formName.trim() || !formShort.trim() || logoUploading) && styles.saveBtnTextDisabled,
                ]}
              >
                {logoUploading
                  ? 'UPLOADING...'
                  : editingTeam ? t('common.save').toUpperCase() : 'ADD TEAM'}
              </Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </Modal>

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
              {t('teams.cannotDelete')}
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

      {/* Delete confirm */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('teams.deleteConfirm').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('teams.deleteDesc')}</Text>
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
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -80,
    left: -40,
    borderRadius: 170,
    backgroundColor: Colors.accent.green,
    opacity: 0.06,
  },
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
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  teamInfo: {
    flex: 1,
    gap: 2,
  },
  teamName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  teamCode: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  teamActions: {
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
  editIcon: { fontSize: 14 },
  deleteIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xl,
    color: Colors.accent.red,
    lineHeight: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.sheet,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing['2xl'],
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoPickerBtn: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
  },
  logoPickerIcon: {
    fontSize: 24,
  },
  logoRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.redSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.red + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRemoveText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.lg,
    color: Colors.accent.red,
    lineHeight: 20,
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
