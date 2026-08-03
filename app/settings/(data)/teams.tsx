import React from 'react';
import { View, ScrollView } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { useIsOnline } from '@/hooks/IsOnlineProvider';
import { useTeamEditForm } from '@/hooks/useTeamEditForm';
import { useDeleteGuard } from '@/hooks/useDeleteGuard';
import {
  NavHeader,
  TeamBadge,
  EmptyState,
  GlowBackground,
  TeamEditSheet,
  EditableEntityRow,
  AddEntityButton,
  DeleteGuardDialogs,
} from '@/components';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/settings/teams/teams.styles';

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

  const teamForm = useTeamEditForm({ teams, addTeam, updateTeam, demoMode });

  const deleteGuard = useDeleteGuard({
    matches,
    archivedRounds,
    closedTournaments,
    isReferencedBy: (m, code) => m.aTeam === code || m.bTeam === code,
    onDelete: deleteTeam,
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader
        title={t('teams.title').toUpperCase()}
        subtitle={t('settings.data.teamsCount', { count: teams.length })}
        onBack={() => goBack()}
        rightElement={
          <AddEntityButton
            testID="teams-add-button"
            label={'+ ' + t('common.add').toUpperCase()}
            onPress={teamForm.openCreate}
          />
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
            <EditableEntityRow
              key={team.code}
              leading={
                <View style={styles.teamBadgeWrap}>
                  <TeamBadge teamCode={team.code} size="lg" />
                  <View style={[styles.teamColorSwatch, { backgroundColor: team.color }]} />
                </View>
              }
              title={team.name}
              subtitle={team.short}
              onEdit={() => teamForm.openEdit(team)}
              onDelete={() => deleteGuard.requestDelete(team.code)}
            />
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

      <DeleteGuardDialogs
        cannotDeleteDescription={t('teams.cannotDelete')}
        deleteConfirmTitle={t('teams.deleteConfirm').toUpperCase()}
        deleteConfirmDescription={t('teams.deleteDesc')}
        showCannotDelete={deleteGuard.showCannotDelete}
        onCloseCannotDelete={deleteGuard.closeCannotDelete}
        showDeleteConfirm={deleteGuard.showDeleteConfirm}
        onCloseDeleteConfirm={deleteGuard.closeDeleteConfirm}
        onConfirmDelete={deleteGuard.confirmDelete}
      />
    </SafeAreaView>
  );
}
