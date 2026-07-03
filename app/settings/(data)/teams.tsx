import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, useColors } from '@/theme';
import { NavHeader, TeamBadge, Sheet, EmptyState, GlowBackground } from '@/components';
import { Team } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { uploadTeamLogo } from '@/supabase/storage';
import { resizeImage, TEAM_LOGO_MAX_DIMENSION } from '@/utils/imageResize';
import { generateTeamCode } from '@/utils/teamCode';
import { makeStyles } from '@/screens/settings/teams/teams.styles';

const TEAM_COLORS = Colors.team;

export default function TeamsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
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
    const asset = result.assets[0];
    let localUri = asset.uri;
    setFormLogo(localUri);
    setLogoUploading(true);
    // Downscale before upload — see #62. Logos only ever render as a small badge.
    try {
      localUri = (await resizeImage(asset.uri, asset, TEAM_LOGO_MAX_DIMENSION)).uri;
    } catch { /* fall back to the original file if resizing fails */ }
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
      const code = generateTeamCode(short);
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
      <GlowBackground />
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
              <View style={styles.teamBadgeWrap}>
                <TeamBadge teamCode={team.code} size="lg" />
                <View style={[styles.teamColorSwatch, { backgroundColor: team.color }]} />
              </View>
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
      <Sheet visible={showEdit} onClose={() => setShowEdit(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {editingTeam ? t('teams.editTitle') : 'NEW TEAM'}
          </Text>

          <BottomSheetScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TEAM NAME</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Manchester City"
                placeholderTextColor={colors.text.placeholder}
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
                placeholderTextColor={colors.text.placeholder}
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
