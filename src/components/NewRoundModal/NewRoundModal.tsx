import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { Avatar } from '@/components/Avatar';
import { Sheet } from '@/components/Sheet/Sheet';
import { Toggle } from '@/components/Toggle';
import { makeStyles } from './NewRoundModal.styles';
import { useColors } from '@/theme';

// ---------------------------------------------------------------------------
// Shared "start a new round" sheet — used by the Home screen and the
// Tournament screen. Reads everything it needs from the store directly,
// so callers only need to render it once and call `store.setModal('newRound')`
// to open it.
// ---------------------------------------------------------------------------

export function NewRoundModal() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
  const modal = useStore((s) => s.modal);
  const tournamentName = useStore((s) => s.tournamentName);
  const players = useStore((s) => s.players);
  const tournamentPlayers = useStore((s) => s.tournamentPlayers);
  const tournamentRounds = useStore((s) => s.tournamentRounds);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const setModal = useStore((s) => s.setModal);
  const startRound = useStore((s) => s.startRound);

  const [newRoundRanked, setNewRoundRanked] = useState(true);
  const [newRoundPlayerIds, setNewRoundPlayerIds] = useState<Set<string>>(new Set());

  const rankedCompleted = archivedRounds.filter((r) => r.ranked).length;
  const rankedLimitReached = tournamentRounds > 0 && rankedCompleted >= tournamentRounds;
  const visible = modal === 'newRound';

  useEffect(() => {
    if (!visible) return;
    setNewRoundRanked(!rankedLimitReached);
    const lastRound = archivedRounds[archivedRounds.length - 1];
    const preSelected = lastRound?.players ?? tournamentPlayers;
    setNewRoundPlayerIds(new Set(preSelected));
    // Only re-initialize when the sheet transitions to open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const close = () => setModal(null);

  const handleStart = () => {
    if (newRoundPlayerIds.size < 2) return;
    startRound(newRoundRanked, Array.from(newRoundPlayerIds));
    setModal(null);
    router.push('/round');
  };

  return (
    <Sheet visible={visible} onClose={close}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('tournament.newRound.title').toUpperCase()}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t('tournament.newRound.subtitle', { name: tournamentName, round: rankedCompleted + 1 })}
          </Text>

          {/* Ranked toggle */}
          <Toggle
            label={t('tournament.newRound.rankedLabel')}
            subtitle={
              rankedLimitReached
                ? t('tournament.newRound.rankedLimitReached', { count: tournamentRounds })
                : t('tournament.newRound.rankedSub')
            }
            value={newRoundRanked}
            onValueChange={setNewRoundRanked}
            disabled={rankedLimitReached}
          />

          {/* Players section */}
          <Text style={styles.playersLabel}>
            {t('tournament.newRound.playersLabel', { count: newRoundPlayerIds.size }).toUpperCase()}
          </Text>

          <BottomSheetScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
            {players.map((player) => {
              const selected = newRoundPlayerIds.has(player.id);
              return (
                <TouchableOpacity
                  key={player.id}
                  style={[styles.playerRow, selected && styles.playerRowSelected]}
                  onPress={() => {
                    setNewRoundPlayerIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(player.id)) {
                        next.delete(player.id);
                      } else {
                        next.add(player.id);
                      }
                      return next;
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Avatar playerId={player.id} size="sm" />
                  <View style={styles.playerRowInfo}>
                    <Text style={styles.playerRowName}>{player.name}</Text>
                    {player.nick ? (
                      <Text style={styles.playerRowNick}>@{player.nick}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </BottomSheetScrollView>

          {newRoundPlayerIds.size < 2 && (
            <Text style={styles.minPlayersHint}>{t('tournament.newRound.minPlayers')}</Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={close} activeOpacity={0.75}>
              <Text style={styles.cancelText}>{t('tournament.newRound.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startBtn, newRoundPlayerIds.size < 2 && styles.startBtnDisabled]}
              onPress={handleStart}
              activeOpacity={0.85}
              disabled={newRoundPlayerIds.size < 2}
            >
              <Text style={[styles.startText, newRoundPlayerIds.size < 2 && styles.startTextDisabled]}>
                {t('tournament.newRound.start').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
    </Sheet>
  );
}
