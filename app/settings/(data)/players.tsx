import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, useColors } from '@/theme';
import { NavHeader, Avatar, EmptyState, GlowBackground } from '@/components';
import { Player } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/settings/players/players.styles';
import { PlayerEditSheet } from '@/screens/settings/players/PlayerEditSheet';
import { PlayerDialogs } from '@/screens/settings/players/PlayerDialogs';

const PLAYER_COLORS = Colors.player;

export default function PlayersScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
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

      <PlayerEditSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        editingPlayer={editingPlayer}
        teams={teams}
        playerColors={PLAYER_COLORS}
        formName={formName}
        onChangeName={setFormName}
        formNick={formNick}
        onChangeNick={setFormNick}
        formTeam={formTeam}
        onChangeTeam={setFormTeam}
        formColor={formColor}
        onChangeColor={setFormColor}
        onSave={handleSave}
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
