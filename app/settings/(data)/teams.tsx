import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTeamEditForm } from '@/hooks/useTeamEditForm';
import { NavHeader, TeamBadge, EmptyState, GlowBackground, TeamEditSheet } from '@/components';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/settings/teams/teams.styles';
import { TeamDialogs } from '@/screens/settings/teams/TeamDialogs';

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCannotDelete, setShowCannotDelete] = useState(false);
  const [pendingDeleteCode, setPendingDeleteCode] = useState<string | null>(null);

  const teamForm = useTeamEditForm({ teams, addTeam, updateTeam, demoMode });

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
          <TouchableOpacity
            testID="teams-add-button"
            style={styles.addBtn}
            onPress={teamForm.openCreate}
            activeOpacity={0.8}
          >
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
            onPress={teamForm.openCreate}
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
                  onPress={() => teamForm.openEdit(team)}
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
        visible={teamForm.visible}
        onClose={teamForm.close}
        editingTeam={teamForm.editingTeam}
        teamColors={teamForm.teamColors}
        formName={teamForm.formName}
        onChangeName={teamForm.setFormName}
        formShort={teamForm.formShort}
        onChangeShort={teamForm.setFormShort}
        formColor={teamForm.formColor}
        onChangeColor={teamForm.setFormColor}
        formLogo={teamForm.formLogo}
        onPickLogo={teamForm.pickLogo}
        onRemoveLogo={teamForm.removeLogo}
        logoUploading={teamForm.logoUploading}
        isOffline={isOffline}
        onSave={teamForm.save}
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
