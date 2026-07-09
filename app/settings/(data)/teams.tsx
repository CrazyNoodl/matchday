import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, useColors } from '@/theme';
import { useIsOnline } from '@/hooks/useIsOnline';
import { NavHeader, TeamBadge, EmptyState, GlowBackground } from '@/components';
import { type Team } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { uploadTeamLogo } from '@/supabase/storage';
import { resizeImage, TEAM_LOGO_MAX_DIMENSION } from '@/utils/imageResize';
import { generateTeamCode } from '@/utils/teamCode';
import { makeStyles } from '@/screens/settings/teams/teams.styles';
import { TeamEditSheet } from '@/screens/settings/teams/TeamEditSheet';
import { TeamDialogs } from '@/screens/settings/teams/TeamDialogs';

const TEAM_COLORS = Colors.team;

export default function TeamsScreen() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
  const teams = useStore((s) => s.teams);
  const demoMode = useStore((s) => s.demoMode);
  const matches = useStore((s) => s.matches);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const closedTournaments = useStore((s) => s.closedTournaments);
  const addTeam = useStore((s) => s.addTeam);
  const updateTeam = useStore((s) => s.updateTeam);
  const deleteTeam = useStore((s) => s.deleteTeam);
  const isOffline = !useIsOnline();

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
    } catch {
      /* fall back to the original file if resizing fails */
    }
    // Demo Mode edits are thrown away on exit (realDataBackup restore) and
    // must never reach the user's real cloud storage — keep the picked
    // logo local-only instead of uploading it under their real account.
    const remoteUrl = demoMode ? localUri : await uploadTeamLogo(localUri);
    if (editSessionRef.current !== session) return; // user moved to a different team's form
    setLogoUploading(false);
    // Local file:// URIs aren't visible to other devices and aren't
    // guaranteed to survive app restarts — only keep the remote URL.
    if (remoteUrl) setFormLogo(remoteUrl);
  }, [demoMode]);

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

  const handleDelete = useCallback(
    (code: string) => {
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
    },
    [matches, archivedRounds, closedTournaments],
  );

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
        title={t('teams.title').toUpperCase()}
        subtitle={t('settings.data.teamsCount', { count: teams.length })}
        onBack={() => goBack()}
        rightElement={
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>{'+ ' + t('common.add').toUpperCase()}</Text>
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

      <TeamEditSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        editingTeam={editingTeam}
        teamColors={TEAM_COLORS}
        formName={formName}
        onChangeName={setFormName}
        formShort={formShort}
        onChangeShort={setFormShort}
        formColor={formColor}
        onChangeColor={setFormColor}
        formLogo={formLogo}
        onPickLogo={pickLogo}
        onRemoveLogo={() => setFormLogo(undefined)}
        logoUploading={logoUploading}
        isOffline={isOffline}
        onSave={handleSave}
      />

      <TeamDialogs
        showCannotDelete={showCannotDelete}
        onCloseCannotDelete={() => setShowCannotDelete(false)}
        showDeleteConfirm={showDeleteConfirm}
        onCloseDeleteConfirm={() => setShowDeleteConfirm(false)}
        onConfirmDelete={confirmDelete}
      />
    </SafeAreaView>
  );
}
