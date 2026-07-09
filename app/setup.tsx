import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, useColors } from '@/theme';
import { Avatar, TeamBadge, SectionLabel, GlowBackground } from '@/components';
import { type Team } from '@/store/types';
import { generateTeamCode } from '@/utils/teamCode';
import { makeStyles } from '@/screens/setup/setup.styles';
import { AddPlayerSheet, AssignTeamSheet, ManageTeamsSheet } from '@/screens/setup/SetupModals';
import { trackEvent } from '@/analytics';

export default function SetupScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const players = useStore((s) => s.players);
  const teams = useStore((s) => s.teams);
  const addTeam = useStore((s) => s.addTeam);
  const deleteTeam = useStore((s) => s.deleteTeam);
  const addPlayer = useStore((s) => s.addPlayer);
  const updatePlayer = useStore((s) => s.updatePlayer);
  const startTournament = useStore((s) => s.startTournament);
  const { t } = useTranslation();

  const [tournamentName, setTournamentName] = useState('');
  const [roundsTarget, setRoundsTarget] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [playerTeams, setPlayerTeams] = useState<Map<string, string>>(new Map());

  // Modals
  const [assignSheetPlayerId, setAssignSheetPlayerId] = useState<string | null>(null);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Add team form
  const [newTeamName, setNewTeamName] = useState('');

  // Add player form
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNick, setNewPlayerNick] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState(teams[0]?.code ?? '');

  const togglePlayer = useCallback(
    (id: string) => {
      setSelectedPlayers((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          setPlayerTeams((pm) => {
            const nm = new Map(pm);
            nm.delete(id);
            return nm;
          });
        } else {
          next.add(id);
          // default to player's own team
          const player = players.find((p) => p.id === id);
          if (player?.teamCode) {
            setPlayerTeams((pm) => new Map(pm).set(id, player.teamCode));
          }
        }
        return next;
      });
    },
    [players],
  );

  const handleAssignTeam = useCallback((playerId: string, teamCode: string) => {
    setPlayerTeams((prev) => new Map(prev).set(playerId, teamCode));
    setAssignSheetPlayerId(null);
  }, []);

  const handleAddTeam = useCallback(() => {
    const n = newTeamName.trim();
    if (!n) return;
    const short = n.slice(0, 3).toUpperCase().replace(/\s/g, '');
    const code = generateTeamCode(short);
    const newTeam: Team = {
      code,
      name: n,
      short,
      color: Colors.team[teams.length % Colors.team.length],
      custom: true,
    };
    addTeam(newTeam);
    setNewTeamName('');
  }, [newTeamName, teams, addTeam]);

  const handleAddPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name) return;
    const id = `player-${Date.now()}`;
    addPlayer({
      id,
      name,
      nick: newPlayerNick.trim() || undefined,
      teamCode: newPlayerTeam || teams[0]?.code || '',
    });
    setNewPlayerName('');
    setNewPlayerNick('');
    setShowAddPlayer(false);
  }, [newPlayerName, newPlayerNick, newPlayerTeam, addPlayer, teams]);

  const handleDeleteTeam = useCallback(
    (code: string) => {
      deleteTeam(code);
    },
    [deleteTeam],
  );

  const canStart = tournamentName.trim().length > 0 && selectedPlayers.size >= 2;

  const handleStart = useCallback(() => {
    if (!canStart) return;
    // apply player teams
    const playerIds = Array.from(selectedPlayers);
    playerTeams.forEach((teamCode, playerId) => {
      const player = players.find((p) => p.id === playerId);
      if (player && player.teamCode !== teamCode) {
        updatePlayer({ ...player, teamCode });
      }
    });
    startTournament(tournamentName.trim(), playerIds, true, roundsTarget);
    trackEvent('tournament_created', { playerCount: playerIds.length, roundsTarget });
    router.push('/');
  }, [
    canStart,
    selectedPlayers,
    playerTeams,
    players,
    updatePlayer,
    startTournament,
    tournamentName,
    router,
  ]);

  const assignSheetPlayer = assignSheetPlayerId
    ? players.find((p) => p.id === assignSheetPlayerId)
    : null;

  const assignSheetCurrentTeamCode = assignSheetPlayerId
    ? (playerTeams.get(assignSheetPlayerId) ??
      players.find((p) => p.id === assignSheetPlayerId)?.teamCode ??
      '')
    : '';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <GlowBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('setup.title').toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>{t('setup.subtitle')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tournament name */}
          <SectionLabel
            label={t('setup.tournamentNameLabel').toUpperCase()}
            style={styles.sectionGap}
          />
          <TextInput
            style={styles.input}
            value={tournamentName}
            onChangeText={setTournamentName}
            placeholder={t('setup.tournamentNamePlaceholder')}
            placeholderTextColor={colors.text.placeholder}
            returnKeyType="done"
            autoCorrect={false}
          />

          {/* Target rounds */}
          <SectionLabel label={t('setup.roundsLabel').toUpperCase()} style={styles.sectionGap} />
          <View style={styles.stepperRow}>
            <View style={styles.stepperInfo}>
              <Text style={styles.stepperDesc}>{t('setup.roundsDesc')}</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepperBtn, roundsTarget === 0 && styles.stepperBtnDisabled]}
                onPress={() => setRoundsTarget((v) => Math.max(0, v - 1))}
                disabled={roundsTarget === 0}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.stepperBtnText,
                    roundsTarget === 0 && styles.stepperBtnTextDisabled,
                  ]}
                >
                  −
                </Text>
              </TouchableOpacity>
              <View style={styles.stepperValue}>
                <Text style={styles.stepperValueText}>
                  {roundsTarget === 0 ? t('setup.roundsUnlimited') : String(roundsTarget)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.stepperBtn, roundsTarget >= 50 && styles.stepperBtnDisabled]}
                onPress={() => setRoundsTarget((v) => Math.min(50, v + 1))}
                disabled={roundsTarget >= 50}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.stepperBtnText,
                    roundsTarget >= 50 && styles.stepperBtnTextDisabled,
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Players */}
          <SectionLabel
            label={t('setup.playersLabel', { count: selectedPlayers.size }).toUpperCase()}
            style={styles.sectionGap}
          />
          <View style={styles.playersList}>
            {players.map((player) => {
              const isSelected = selectedPlayers.has(player.id);
              const assignedTeam = playerTeams.get(player.id) ?? player.teamCode;
              return (
                <TouchableOpacity
                  key={player.id}
                  style={[styles.playerRow, isSelected && styles.playerRowSelected]}
                  onPress={() => togglePlayer(player.id)}
                  activeOpacity={0.75}
                >
                  <Avatar playerId={player.id} size="md" />
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {player.nick ? <Text style={styles.playerNick}>@{player.nick}</Text> : null}
                  </View>
                  {isSelected && (
                    <TouchableOpacity
                      style={styles.teamChip}
                      onPress={() => setAssignSheetPlayerId(player.id)}
                      activeOpacity={0.75}
                    >
                      <TeamBadge teamCode={assignedTeam} size="xs" />
                    </TouchableOpacity>
                  )}
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Add player row */}
            <TouchableOpacity
              style={styles.manageTeamsRow}
              onPress={() => {
                setNewPlayerName('');
                setNewPlayerNick('');
                setNewPlayerTeam(teams[0]?.code ?? '');
                setShowAddPlayer(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.manageTeamsIcon}>👤</Text>
              <Text style={styles.manageTeamsText}>{t('setup.addPlayer')}</Text>
              <Text style={styles.manageTeamsChevron}>›</Text>
            </TouchableOpacity>

            {/* Manage teams row */}
            <TouchableOpacity
              style={styles.manageTeamsRow}
              onPress={() => setShowTeamsModal(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.manageTeamsIcon}>🛡</Text>
              <Text style={styles.manageTeamsText}>{t('setup.manageTeams')}</Text>
              <Text style={styles.manageTeamsChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          <Text style={[styles.startBtnText, !canStart && styles.startBtnTextDisabled]}>
            {t('setup.startTournament').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <AddPlayerSheet
        visible={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        teams={teams}
        name={newPlayerName}
        onChangeName={setNewPlayerName}
        nick={newPlayerNick}
        onChangeNick={setNewPlayerNick}
        teamCode={newPlayerTeam}
        onChangeTeamCode={setNewPlayerTeam}
        onSubmit={handleAddPlayer}
      />

      <AssignTeamSheet
        visible={!!assignSheetPlayerId}
        onClose={() => setAssignSheetPlayerId(null)}
        playerName={assignSheetPlayer?.name ?? ''}
        teams={teams}
        currentTeamCode={assignSheetCurrentTeamCode}
        onSelectTeam={(code) => assignSheetPlayerId && handleAssignTeam(assignSheetPlayerId, code)}
      />

      <ManageTeamsSheet
        visible={showTeamsModal}
        onClose={() => setShowTeamsModal(false)}
        teams={teams}
        newTeamName={newTeamName}
        onChangeNewTeamName={setNewTeamName}
        onAddTeam={handleAddTeam}
        onDeleteTeam={handleDeleteTeam}
      />
    </SafeAreaView>
  );
}
