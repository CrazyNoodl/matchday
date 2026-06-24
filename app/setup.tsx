import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { Avatar } from '@/components/Avatar';
import { TeamBadge } from '@/components/TeamBadge';
import { SectionLabel } from '@/components/SectionLabel';
import { GlowBackground } from '@/components/GlowBackground';
import { Team } from '@/store/types';

const PLAYER_COLORS = Colors.player;

export default function SetupScreen() {
  const router = useRouter();
  const store = useStore();
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
    const code = short + Date.now().toString(36).slice(-3).toUpperCase();
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
            placeholderTextColor={Colors.text.placeholder}
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
                placeholderTextColor={Colors.text.placeholder}
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
                placeholderTextColor={Colors.text.placeholder}
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
                placeholderTextColor={Colors.text.placeholder}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.text.secondary,
    lineHeight: 28,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  sectionGap: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  optionInfo: {
    flex: 1,
    gap: 3,
  },
  optionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  optionDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  stepperInfo: {
    flex: 1,
  },
  stepperDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderColor: Colors.border.medium,
  },
  stepperBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.lg,
    color: Colors.accent.green,
    lineHeight: 22,
  },
  stepperBtnTextDisabled: {
    color: Colors.text.ghost,
  },
  stepperValue: {
    width: 44,
    alignItems: 'center',
  },
  stepperValueText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  playersList: {
    gap: Spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  playerRowSelected: {
    backgroundColor: Colors.accent.greenSubtle,
    borderColor: Colors.accent.greenBorder,
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  playerNick: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  teamChip: {
    padding: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  checkMark: {
    color: Colors.accent.greenDark,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    lineHeight: 16,
  },
  manageTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  manageTeamsIcon: {
    fontSize: 16,
  },
  manageTeamsText: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  manageTeamsChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.muted,
    lineHeight: 24,
  },
  // Bottom CTA
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.base,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  startBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  startBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  startBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.accent.greenDark,
    letterSpacing: 0.8,
  },
  startBtnTextDisabled: {
    color: Colors.text.ghost,
  },
  // Modals
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
    maxHeight: '75%',
  },
  sheetTall: {
    maxHeight: '85%',
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
    marginBottom: Spacing.lg,
  },
  teamGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  teamGridList: {
    flex: 1,
  },
  teamGridItem: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  teamGridName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  teamGridCode: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  doneBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  doneBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.greenDark,
    letterSpacing: 0.5,
  },
  // Manage teams
  teamListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  teamListName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  teamListCode: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  removeTeamBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.redSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTeamIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.lg,
    color: Colors.accent.red,
    lineHeight: 22,
    textAlign: 'center',
  },
  addTeamRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addTeamInput: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  addTeamBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTeamBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  addTeamBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.accent.greenDark,
    letterSpacing: 0.5,
  },
  addTeamBtnTextDisabled: {
    color: Colors.text.ghost,
  },
  // Add player form styles
  addPlayerFormGroup: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addPlayerFormLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 1,
  },
  addPlayerInput: {
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
  addPlayerTeamPicker: { flexGrow: 0 },
  addPlayerTeamItem: {
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
    width: 72,
  },
  addPlayerTeamName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  addPlayerColorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  addPlayerColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  addPlayerColorDotSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  addPlayerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  addPlayerCancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  addPlayerCancelText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  doneBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  doneBtnTextDisabled: {
    color: Colors.text.ghost,
  },
});
