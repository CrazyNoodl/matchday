import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { NavHeader, Avatar, EmptyState, GlowBackground, PlayerEditSheet } from '@/components';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/settings/players/players.styles';
import { PlayerDialogs } from '@/screens/settings/players/PlayerDialogs';
import { usePlayerEditForm } from '@/hooks/usePlayerEditForm';

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCannotDelete, setShowCannotDelete] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const playerForm = usePlayerEditForm({
    addPlayer,
    updatePlayer,
    defaultTeamCode: useCallback(() => teams[0]?.code ?? '', [teams]),
    teams,
  });

  const handleDelete = useCallback(
    (id: string) => {
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
    },
    [matches, archivedRounds, closedTournaments],
  );

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
        title={t('players.title').toUpperCase()}
        subtitle={t('settings.data.playersCount', { count: players.length })}
        onBack={() => goBack()}
        rightElement={
          <TouchableOpacity style={styles.addBtn} onPress={playerForm.openCreate} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>{'+ ' + t('common.add').toUpperCase()}</Text>
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
            onPress={playerForm.openCreate}
          />
        ) : (
          players.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <Avatar playerId={player.id} size="md" />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.nick && <Text style={styles.playerNick}>@{player.nick}</Text>}
              </View>
              <View style={styles.playerActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => playerForm.openEdit(player)}
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

      <PlayerEditSheet
        visible={playerForm.visible}
        onClose={playerForm.close}
        editingPlayer={playerForm.editingPlayer}
        teams={teams}
        formName={playerForm.formName}
        onChangeName={playerForm.setFormName}
        formNick={playerForm.formNick}
        onChangeNick={playerForm.setFormNick}
        formTeam={playerForm.formTeam}
        onChangeTeam={playerForm.setFormTeam}
        onSave={playerForm.save}
      />

      <PlayerDialogs
        showCannotDelete={showCannotDelete}
        onCloseCannotDelete={() => setShowCannotDelete(false)}
        showDeleteConfirm={showDeleteConfirm}
        onCloseDeleteConfirm={() => setShowDeleteConfirm(false)}
        onConfirmDelete={confirmDelete}
      />
    </SafeAreaView>
  );
}
