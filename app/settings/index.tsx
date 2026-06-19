import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { LANGUAGES } from '@/i18n';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';

interface SettingsRowProps {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
}

function SettingsRow({ icon, label, sub, onPress, right, chevron = true }: SettingsRowProps) {
  const Row = onPress ? TouchableOpacity : View;
  return (
    <Row
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right ?? (chevron && onPress ? (
        <Text style={styles.chevron}>›</Text>
      ) : null)}
    </Row>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const store = useStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { players, teams, showNick, showTeamLogo, hasTournament, tournamentName, language, archivedRounds, closedTournaments } = store;

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const SEED_PLAYER_IDS = ['player-1', 'player-2', 'player-3'];
  const SEED_TEAM_CODES = ['JUV', 'TOT', 'GAL'];
  const isDefaultState =
    !hasTournament &&
    archivedRounds.length === 0 &&
    closedTournaments.length === 0 &&
    players.length === SEED_PLAYER_IDS.length &&
    players.every((p) => SEED_PLAYER_IDS.includes(p.id)) &&
    teams.length === SEED_TEAM_CODES.length &&
    teams.every((t) => SEED_TEAM_CODES.includes(t.code)) &&
    showNick === true &&
    showTeamLogo === true &&
    language === 'en';

  const handleReset = () => {
    store.resetStore();
    setShowResetConfirm(false);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />
      <NavHeader title={t('settings.title')} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tournament section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.tournament.section')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="🏆"
              label={t('settings.tournament.label')}
              sub={hasTournament ? tournamentName : t('settings.tournament.noActive')}
              onPress={() => router.push('/settings/tournaments')}
            />
          </View>
        </View>

        {/* Data section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.data.section')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="👤"
              label={t('settings.data.players')}
              sub={t('settings.data.playersCount', { count: players.length })}
              onPress={() => router.push('/settings/players')}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="🛡"
              label={t('settings.data.teams')}
              sub={t('settings.data.teamsCount', { count: teams.length })}
              onPress={() => router.push('/settings/teams')}
            />
          </View>
        </View>

        {/* Display section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.display.section')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="🏷"
              label={t('settings.display.showNicknames')}
              sub={t('settings.display.showNicknamesDesc')}
              onPress={() => store.setShowNick(!showNick)}
              right={
                <Switch
                  value={showNick}
                  onValueChange={store.setShowNick}
                  trackColor={{ false: Colors.bg.elevated, true: Colors.accent.green }}
                  thumbColor={Colors.text.primary}
                />
              }
              chevron={false}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="🎨"
              label={t('settings.display.showTeamLogos')}
              sub={t('settings.display.showTeamLogosDesc')}
              onPress={() => store.setShowTeamLogo(!showTeamLogo)}
              right={
                <Switch
                  value={showTeamLogo}
                  onValueChange={store.setShowTeamLogo}
                  trackColor={{ false: Colors.bg.elevated, true: Colors.accent.green }}
                  thumbColor={Colors.text.primary}
                />
              }
              chevron={false}
            />
          </View>
        </View>

        {/* Language section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.language.section')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon={currentLang.flag}
              label={t('settings.language.label')}
              sub={currentLang.nativeName}
              onPress={() => router.push('/settings/language')}
            />
          </View>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.about.section')}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="ℹ️"
              label={t('settings.about.appName')}
              sub={t('settings.about.version')}
              chevron={false}
            />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.danger.section')}</Text>
          <TouchableOpacity
            style={[styles.resetBtn, isDefaultState && styles.resetBtnDisabled]}
            onPress={() => !isDefaultState && setShowResetConfirm(true)}
            activeOpacity={isDefaultState ? 1 : 0.8}
          >
            <Text style={[styles.resetBtnText, isDefaultState && styles.resetBtnTextDisabled]}>
              🗑  {t('settings.danger.resetAll')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reset confirmation dialog */}
      <Modal
        visible={showResetConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetConfirm(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setShowResetConfirm(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('settings.danger.resetTitle')}</Text>
            <Text style={styles.dialogDesc}>{t('settings.danger.resetDesc')}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowResetConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelText}>{t('settings.danger.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogConfirmText}>{t('settings.danger.reset')}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -80,
    left: -40,
    borderRadius: 170,
    backgroundColor: Colors.accent.green,
    opacity: 0.06,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
    letterSpacing: 1.2,
    paddingLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    fontSize: 18,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  rowSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  chevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.muted,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginLeft: 56 + Spacing.lg,
  },
  resetBtn: {
    backgroundColor: 'rgba(255,93,90,0.10)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.25)',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  resetBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderColor: Colors.border.default,
  },
  resetBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.accent.red,
  },
  resetBtnTextDisabled: {
    color: Colors.text.ghost,
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  dialog: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing['2xl'],
    marginHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  dialogTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    alignItems: 'center',
  },
  dialogCancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent.red,
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: '#fff',
  },
});
