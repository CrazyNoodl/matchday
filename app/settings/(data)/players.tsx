import React, { useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import {
  NavHeader,
  Avatar,
  EmptyState,
  GlowBackground,
  PlayerEditSheet,
  EditableEntityRow,
  AddEntityButton,
  DeleteGuardDialogs,
} from '@/components';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/settings/players/players.styles';
import { usePlayerEditForm } from '@/hooks/usePlayerEditForm';
import { useDeleteGuard } from '@/hooks/useDeleteGuard';

export default function PlayersScreen() {
  const goBack = useGoBack();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const players = useStore((s) => s.players);
  const teams = useStore((s) => s.teams);
  const matches = useStore((s) => s.matches);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const closedTournaments = useStore((s) => s.closedTournaments);
  const addPlayer = useStore((s) => s.addPlayer);
  const updatePlayer = useStore((s) => s.updatePlayer);
  const deletePlayer = useStore((s) => s.deletePlayer);

  const playerForm = usePlayerEditForm({
    addPlayer,
    updatePlayer,
    defaultTeamCode: useCallback(() => teams[0]?.code ?? '', [teams]),
    teams,
    players,
  });

  const deleteGuard = useDeleteGuard({
    matches,
    archivedRounds,
    closedTournaments,
    isReferencedBy: (m, id) => m.aId === id || m.bId === id,
    onDelete: deletePlayer,
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader
        title={t('players.title').toUpperCase()}
        subtitle={t('settings.data.playersCount', { count: players.length })}
        onBack={() => goBack()}
        rightElement={
          <AddEntityButton
            testID="players-add-button"
            label={'+ ' + t('common.add').toUpperCase()}
            onPress={playerForm.openCreate}
          />
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
            onPress={playerForm.openCreate}
          />
        ) : (
          players.map((player) => (
            <EditableEntityRow
              key={player.id}
              leading={<Avatar playerId={player.id} size="md" />}
              title={player.name}
              subtitle={player.nick ? `@${player.nick}` : undefined}
              onEdit={() => playerForm.openEdit(player)}
              onDelete={() => deleteGuard.requestDelete(player.id)}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <PlayerEditSheet
        visible={playerForm.visible}
        onClose={playerForm.close}
        editingPlayer={playerForm.editingPlayer}
        teams={teams}
        players={players}
        formName={playerForm.formName}
        onChangeName={playerForm.setFormName}
        formNick={playerForm.formNick}
        onChangeNick={playerForm.setFormNick}
        formTeam={playerForm.formTeam}
        onChangeTeam={playerForm.setFormTeam}
        isDuplicateName={playerForm.isDuplicateName}
        onSave={playerForm.save}
      />

      <DeleteGuardDialogs
        cannotDeleteDescription={t('players.cannotDelete')}
        deleteConfirmTitle={t('players.deleteConfirm').toUpperCase()}
        deleteConfirmDescription={t('players.deleteDesc')}
        showCannotDelete={deleteGuard.showCannotDelete}
        onCloseCannotDelete={deleteGuard.closeCannotDelete}
        showDeleteConfirm={deleteGuard.showDeleteConfirm}
        onCloseDeleteConfirm={deleteGuard.closeDeleteConfirm}
        onConfirmDelete={deleteGuard.confirmDelete}
      />
    </SafeAreaView>
  );
}
