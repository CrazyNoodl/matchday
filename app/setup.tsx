import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, useColors } from '@/theme';
import { Avatar, TeamBadge, SectionLabel, GlowBackground } from '@/components';
import { Team } from '@/store/types';
import { generateTeamCode } from '@/utils/teamCode';
import { makeStyles } from '@/screens/setup/setup.styles';

const PLAYER_COLORS = Colors.player;

export default function SetupScreen() {
  const router = useRouter();
  const store = useStore();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { players, teams, addTeam, deleteTeam, addPlayer } = store;
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
  const [newPlayerColor, setNewPlayerColor] = useState<string>(PLAYER_COLORS[0]);

  const togglePlayer = useCallback((id: string) => {
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
  }, [players]);

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
      color: newPlayerColor,
    });
    setNewPlayerName('');
    setNewPlayerNick('');
    setShowAddPlayer(false);
  }, [newPlayerName, newPlayerNick, newPlayerTeam, newPlayerColor, addPlayer, teams]);

  const handleDeleteTeam = useCallback((code: string) => {
    deleteTeam(code);
  }, [deleteTeam]);

  const canStart =
    tournamentName.trim().length > 0 && selectedPlayers.size >= 2;

  const handleStart = useCallback(() => {
    if (!canStart) return;
    // apply player teams
    const playerIds = Array.from(selectedPlayers);
    playerTeams.forEach((teamCode, playerId) => {
      const player = players.find((p) => p.id === playerId);
      if (player && player.teamCode !== teamCode) {
        store.updatePlayer({ ...player, teamCode });
      }
    });
    store.startTournament(tournamentName.trim(), playerIds, true, roundsTarget);
    router.push('/');
  }, [canStart, selectedPlayers, playerTeams, players, store, tournamentName, router]);

  const assignSheetPlayer = assignSheetPlayerId
    ? players.find((p) => p.id === assignSheetPlayerId)
    : null;

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
          <Text style={styles.headerTitle}>{t('setup.title')}</Text>
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
          <SectionLabel label={t('setup.tournamentNameLabel')} style={styles.sectionGap} />
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
          <SectionLabel label={t('setup.roundsLabel')} style={styles.sectionGap} />
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
                <Text style={[styles.stepperBtnText, roundsTarget === 0 && styles.stepperBtnTextDisabled]}>−</Text>
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
                <Text style={[styles.stepperBtnText, roundsTarget >= 50 && styles.stepperBtnTextDisabled]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Players */}
          <SectionLabel
            label={t('setup.playersLabel', { count: selectedPlayers.size })}
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
                    {player.nick ? (
                      <Text style={styles.playerNick}>@{player.nick}</Text>
                    ) : null}
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
                  <View
                    style={[
                      styles.checkCircle,
                      isSelected && styles.checkCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
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
                setNewPlayerColor(PLAYER_COLORS[players.length % PLAYER_COLORS.length]);
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
          <Text
            style={[styles.startBtnText, !canStart && styles.startBtnTextDisabled]}
          >
            {t('setup.startTournament')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Player Sheet */}
      <Modal
        visible={showAddPlayer}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowAddPlayer(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowAddPlayer(false)} />
        <View style={[styles.sheet, styles.sheetTall]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('setup.newPlayer')}</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.addPlayerFormGroup}>
              <Text style={styles.addPlayerFormLabel}>{t('setup.form.name')}</Text>
              <TextInput
                style={styles.addPlayerInput}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                placeholder={t('setup.form.playerNamePlaceholder')}
                placeholderTextColor={colors.text.placeholder}
                autoFocus
                autoCorrect={false}
              />
            </View>
            <View style={styles.addPlayerFormGroup}>
              <Text style={styles.addPlayerFormLabel}>{t('setup.form.nickname')}</Text>
              <TextInput
                style={styles.addPlayerInput}
                value={newPlayerNick}
                onChangeText={setNewPlayerNick}
                placeholder={t('setup.form.nicknamePlaceholder')}
                placeholderTextColor={colors.text.placeholder}
                autoCorrect={false}
              />
            </View>
            <View style={styles.addPlayerFormGroup}>
              <Text style={styles.addPlayerFormLabel}>{t('setup.form.defaultTeam')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addPlayerTeamPicker}>
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.code}
                    style={[
                      styles.addPlayerTeamItem,
                      newPlayerTeam === t.code && {
                        borderColor: t.color + '88',
                        backgroundColor: t.color + '22',
                      },
                    ]}
                    onPress={() => setNewPlayerTeam(t.code)}
                    activeOpacity={0.8}
                  >
                    <TeamBadge teamCode={t.code} size="md" />
                    <Text style={styles.addPlayerTeamName} numberOfLines={1}>{t.short}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.addPlayerFormGroup}>
              <Text style={styles.addPlayerFormLabel}>{t('setup.form.color')}</Text>
              <View style={styles.addPlayerColorPicker}>
                {PLAYER_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.addPlayerColorDot,
                      { backgroundColor: c },
                      newPlayerColor === c && styles.addPlayerColorDotSelected,
                    ]}
                    onPress={() => setNewPlayerColor(c)}
                    activeOpacity={0.8}
                  />
                ))}
              </View>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
          <View style={styles.addPlayerActions}>
            <TouchableOpacity
              style={styles.addPlayerCancelBtn}
              onPress={() => setShowAddPlayer(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.addPlayerCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneBtn, { flex: 2, marginTop: 0 }, !newPlayerName.trim() && styles.doneBtnDisabled]}
              onPress={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, !newPlayerName.trim() && styles.doneBtnTextDisabled]}>
                {t('setup.addPlayerBtn')}
              </Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </Modal>

      {/* Assign Team Sheet */}
      <Modal
        visible={!!assignSheetPlayerId}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAssignSheetPlayerId(null)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setAssignSheetPlayerId(null)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {t('setup.teamFor', { name: assignSheetPlayer?.name?.toUpperCase() ?? '' })}
          </Text>
          <FlatList
            data={teams}
            numColumns={2}
            keyExtractor={(t) => t.code}
            columnWrapperStyle={styles.teamGrid}
            style={styles.teamGridList}
            renderItem={({ item }) => {
              const currentTeam =
                assignSheetPlayerId
                  ? (playerTeams.get(assignSheetPlayerId) ??
                    players.find((p) => p.id === assignSheetPlayerId)?.teamCode ??
                    '')
                  : '';
              const isActive = item.code === currentTeam;
              return (
                <TouchableOpacity
                  style={[
                    styles.teamGridItem,
                    isActive && {
                      borderColor: item.color + '88',
                      backgroundColor: item.color + '18',
                    },
                  ]}
                  onPress={() =>
                    assignSheetPlayerId &&
                    handleAssignTeam(assignSheetPlayerId, item.code)
                  }
                  activeOpacity={0.8}
                >
                  <TeamBadge teamCode={item.code} size="lg" />
                  <Text style={styles.teamGridName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.teamGridCode}>{item.short}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setAssignSheetPlayerId(null)}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{t('common.done')}</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </Modal>

      {/* Manage Teams Sheet */}
      <Modal
        visible={showTeamsModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowTeamsModal(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowTeamsModal(false)}
        />
        <View style={[styles.sheet, styles.sheetTall]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('setup.manageTeamsTitle')}</Text>
          <ScrollView
            style={styles.flex}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {teams.map((team) => (
              <View key={team.code} style={styles.teamListRow}>
                <TeamBadge teamCode={team.code} size="md" />
                <View style={styles.flex}>
                  <Text style={styles.teamListName}>{team.name}</Text>
                  <Text style={styles.teamListCode}>{team.short}</Text>
                </View>
                {team.custom && (
                  <TouchableOpacity
                    style={styles.removeTeamBtn}
                    onPress={() => handleDeleteTeam(team.code)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeTeamIcon}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add team input */}
            <View style={styles.addTeamRow}>
              <TextInput
                style={styles.addTeamInput}
                value={newTeamName}
                onChangeText={setNewTeamName}
                placeholder={t('setup.teamNamePlaceholder')}
                placeholderTextColor={colors.text.placeholder}
                returnKeyType="done"
                onSubmitEditing={handleAddTeam}
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[
                  styles.addTeamBtn,
                  !newTeamName.trim() && styles.addTeamBtnDisabled,
                ]}
                onPress={handleAddTeam}
                disabled={!newTeamName.trim()}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.addTeamBtnText,
                    !newTeamName.trim() && styles.addTeamBtnTextDisabled,
                  ]}
                >
                  {t('common.add')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setShowTeamsModal(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{t('common.done')}</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
