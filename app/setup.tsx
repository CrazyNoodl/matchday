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
import { useColors } from '@/theme';
import {
  Avatar,
  TeamBadge,
  SectionLabel,
  GlowBackground,
  PlayerEditSheet,
  TeamEditSheet,
  TeamAssignSheet,
} from '@/components';
import { useIsOnline } from '@/hooks/useIsOnline';
import { usePlayerEditForm } from '@/hooks/usePlayerEditForm';
import { useTeamEditForm } from '@/hooks/useTeamEditForm';
import { makeStyles } from '@/screens/setup/setup.styles';
import { trackEvent } from '@/analytics';

export default function SetupScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const players = useStore((s) => s.players);
  const teams = useStore((s) => s.teams);
  const demoMode = useStore((s) => s.demoMode);
  const addTeam = useStore((s) => s.addTeam);
  const updateTeam = useStore((s) => s.updateTeam);
  const addPlayer = useStore((s) => s.addPlayer);
  const updatePlayer = useStore((s) => s.updatePlayer);
  const startTournament = useStore((s) => s.startTournament);
  const isOffline = !useIsOnline();
  const { t } = useTranslation();

  const [tournamentName, setTournamentName] = useState('');
  const [roundsTarget, setRoundsTarget] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [teamAssignPlayerId, setTeamAssignPlayerId] = useState<string | null>(null);

  const playerForm = usePlayerEditForm({
    addPlayer,
    updatePlayer,
    defaultTeamCode: useCallback(() => teams[0]?.code ?? '', [teams]),
  });
  const teamForm = useTeamEditForm({ teams, addTeam, updateTeam, demoMode });

  const togglePlayer = useCallback((id: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const teamAssignPlayer = teamAssignPlayerId
    ? (players.find((p) => p.id === teamAssignPlayerId) ?? null)
    : null;

  const canStart = tournamentName.trim().length > 0 && selectedPlayers.size >= 2;

  const handleStart = useCallback(() => {
    if (!canStart) return;
    const playerIds = Array.from(selectedPlayers);
    startTournament(tournamentName.trim(), playerIds, true, roundsTarget);
    trackEvent('tournament_created', { playerCount: playerIds.length, roundsTarget });
    router.push('/');
  }, [canStart, selectedPlayers, startTournament, tournamentName, roundsTarget, router]);

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
                      onPress={(e) => {
                        e.stopPropagation();
                        setTeamAssignPlayerId(player.id);
                      }}
                      activeOpacity={0.75}
                    >
                      <TeamBadge teamCode={player.teamCode} size="md" />
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
              onPress={playerForm.openCreate}
              activeOpacity={0.75}
            >
              <Text style={styles.manageTeamsIcon}>👤</Text>
              <Text style={styles.manageTeamsText}>{t('setup.addPlayer')}</Text>
              <Text style={styles.manageTeamsChevron}>›</Text>
            </TouchableOpacity>

            {/* Add team row */}
            <TouchableOpacity
              style={styles.manageTeamsRow}
              onPress={teamForm.openCreate}
              activeOpacity={0.75}
            >
              <Text style={styles.manageTeamsIcon}>🛡</Text>
              <Text style={styles.manageTeamsText}>{t('setup.addTeam')}</Text>
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

      <TeamAssignSheet
        visible={!!teamAssignPlayer}
        onClose={() => setTeamAssignPlayerId(null)}
        playerName={teamAssignPlayer?.name ?? ''}
        teams={teams}
        selectedCode={teamAssignPlayer?.teamCode ?? ''}
        onSelect={(code) => {
          if (teamAssignPlayer) {
            updatePlayer({ ...teamAssignPlayer, teamCode: code });
          }
          setTeamAssignPlayerId(null);
        }}
      />
    </SafeAreaView>
  );
}
