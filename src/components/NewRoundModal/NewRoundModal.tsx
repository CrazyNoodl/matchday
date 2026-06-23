import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { Avatar } from '@/components/Avatar';

// ---------------------------------------------------------------------------
// Shared "start a new round" sheet — used by the Home screen and the
// Tournament screen. Reads everything it needs from the store directly,
// so callers only need to render it once and call `store.setModal('newRound')`
// to open it.
// ---------------------------------------------------------------------------

export function NewRoundModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const store = useStore();

  const {
    modal,
    tournamentName,
    players,
    tournamentPlayers,
    tournamentRounds,
    archivedRounds,
  } = store;

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

  const close = () => store.setModal(null);

  const handleStart = () => {
    if (newRoundPlayerIds.size < 2) return;
    store.startRound(newRoundRanked, Array.from(newRoundPlayerIds));
    store.setModal(null);
    router.push('/round');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.container}>
        <Pressable style={styles.overlay} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{t('tournament.newRound.title')}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t('tournament.newRound.subtitle', { name: tournamentName, round: rankedCompleted + 1 })}
          </Text>

          {/* Ranked toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, rankedLimitReached && styles.toggleRowDisabled]}
            onPress={() => !rankedLimitReached && setNewRoundRanked((v) => !v)}
            activeOpacity={rankedLimitReached ? 1 : 0.8}
          >
            <View style={styles.toggleLabelBlock}>
              <Text style={[styles.toggleLabel, rankedLimitReached && styles.toggleLabelDisabled]}>
                {t('tournament.newRound.rankedLabel')}
              </Text>
              <Text style={styles.toggleSub}>
                {rankedLimitReached
                  ? t('tournament.newRound.rankedLimitReached', { count: tournamentRounds })
                  : t('tournament.newRound.rankedSub')}
              </Text>
            </View>
            <View style={[styles.toggle, newRoundRanked && !rankedLimitReached && styles.toggleOn]}>
              <View
                style={[
                  styles.toggleKnob,
                  newRoundRanked && !rankedLimitReached && styles.toggleKnobOn,
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Players section */}
          <Text style={styles.playersLabel}>
            {t('tournament.newRound.playersLabel', { count: newRoundPlayerIds.size })}
          </Text>

          <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
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
          </ScrollView>

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
                {t('tournament.newRound.start')}
              </Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    paddingBottom: Spacing['2xl'],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginBottom: Spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  toggleRowDisabled: {
    opacity: 0.55,
  },
  toggleLabelBlock: {
    flex: 1,
    gap: 3,
  },
  toggleLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  toggleLabelDisabled: {
    color: Colors.text.muted,
  },
  toggleSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.text.muted,
    alignSelf: 'flex-start',
  },
  toggleKnobOn: {
    backgroundColor: Colors.accent.greenDark,
    alignSelf: 'flex-end',
  },
  playersLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playersList: {
    maxHeight: 220,
    marginBottom: Spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginBottom: 4,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  playerRowSelected: {
    borderColor: Colors.accent.greenBorder,
    backgroundColor: Colors.accent.greenSubtle,
  },
  playerRowInfo: {
    flex: 1,
    gap: 1,
  },
  playerRowName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  playerRowNick: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxOn: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  checkmark: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
    color: Colors.accent.greenDark,
    lineHeight: 16,
  },
  minPlayersHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.accent.red,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  cancelText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    letterSpacing: 0.4,
  },
  startBtn: {
    flex: 2,
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.accent.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    shadowOpacity: 0,
    elevation: 0,
  },
  startText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.greenDark,
    letterSpacing: 0.6,
  },
  startTextDisabled: {
    color: Colors.text.ghost,
  },
});
