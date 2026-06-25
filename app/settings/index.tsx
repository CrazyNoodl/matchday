import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { LANGUAGES } from '@/i18n';
import { useColors } from '@/theme';
import { NavHeader, GlowBackground } from '@/components';
import { signOut } from '@/supabase/auth';
import { supabase, supabaseConfigured } from '@/supabase/client';
import { makeStyles } from '@/screens/settings/settings.styles';

interface SettingsRowProps {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
}

function SettingsRow({ icon, label, sub, onPress, right, chevron = true }: SettingsRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
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
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const store = useStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  const { players, teams, showNick, showTeamLogo, colorScheme, hasTournament, tournamentName, language, archivedRounds, closedTournaments, demoMode } = store;

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

  const handleReset = async () => {
    if (demoMode) store.setDemoMode(false);
    setIsResetting(true);
    await store.resetStore();
    setIsResetting(false);
    setShowResetConfirm(false);
    router.dismissAll();
    router.replace('/');
  };

  const handleVersionTap = () => {
    if (devUnlocked) return;
    const next = versionTaps + 1;
    setVersionTaps(next);
    if (next === 3) {
      router.push('/settings/changelog');
      return;
    }
    if (next >= 10) {
      setDevUnlocked(true);
      setVersionTaps(0);
    }
  };

  const handleSignOut = () => setShowSignOutConfirm(true);

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false);
    try {
      await signOut();
    } catch (e) {
      console.warn('[signOut]', e);
    }
  };

  const handleDemoToggle = (on: boolean) => {
    if (on && hasTournament) {
      setShowDemoConfirm(true);
      return;
    }
    store.setDemoMode(on);
    if (on) { router.dismissAll(); router.replace('/'); }
  };

  const confirmEnableDemo = () => {
    setShowDemoConfirm(false);
    store.setDemoMode(true);
    router.dismissAll();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.title')} onBack={() => goBack()} />

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
            {/* Theme toggle */}
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[styles.themeBtn, colorScheme === 'dark' && styles.themeBtnActive]}
                onPress={() => store.setColorScheme('dark')}
                activeOpacity={0.75}
              >
                <Text style={styles.themeBtnIcon}>🌙</Text>
                <Text style={[styles.themeBtnLabel, colorScheme === 'dark' && styles.themeBtnLabelActive]}>
                  {t('settings.display.themeDark', 'Темна')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, colorScheme === 'light' && styles.themeBtnActive]}
                onPress={() => store.setColorScheme('light')}
                activeOpacity={0.75}
              >
                <Text style={styles.themeBtnIcon}>☀️</Text>
                <Text style={[styles.themeBtnLabel, colorScheme === 'light' && styles.themeBtnLabelActive]}>
                  {t('settings.display.themeLight', 'Світла')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <SettingsRow
              icon="🏷"
              label={t('settings.display.showNicknames')}
              sub={t('settings.display.showNicknamesDesc')}
              onPress={() => store.setShowNick(!showNick)}
              right={
                <Switch
                  value={showNick}
                  onValueChange={store.setShowNick}
                  trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
                  thumbColor={colors.text.primary}
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
                  trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
                  thumbColor={colors.text.primary}
                />
              }
              chevron={false}
            />
          </View>
        </View>

        {/* Account section */}
        {supabaseConfigured && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ACCOUNT</Text>
            <View style={styles.card}>
              <SettingsRow
                icon="✉️"
                label={userEmail ?? '—'}
                sub="Signed in"
                chevron={false}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="🚪"
                label="Sign Out"
                chevron={false}
                onPress={handleSignOut}
              />
            </View>
          </View>
        )}

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
              sub={
                devUnlocked
                  ? '🛠  Developer mode on'
                  : versionTaps >= 7
                    ? `${10 - versionTaps} more taps to unlock dev menu`
                    : t('settings.about.version', { version: Constants.expoConfig?.version ?? '' })
              }
              onPress={handleVersionTap}
              chevron={false}
            />
          </View>
        </View>

        {/* Developer section */}
        {devUnlocked && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.accent.blue }]}>DEVELOPER</Text>
            <View style={styles.card}>
              <SettingsRow
                icon="⚙️"
                label="Developer Menu"
                sub="Import tools and internal options"
                onPress={() => router.push('/settings/developer')}
              />
            </View>
          </View>
        )}

        {/* Demo Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('demo.label').toUpperCase()}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="✨"
              label={t('demo.label')}
              sub={t('demo.desc')}
              onPress={() => handleDemoToggle(!demoMode)}
              right={
                <Switch
                  value={demoMode}
                  onValueChange={(v) => handleDemoToggle(v)}
                  trackColor={{ false: colors.bg.elevated, true: colors.accent.yellow }}
                  thumbColor={colors.text.primary}
                />
              }
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

      {/* Sign out confirmation dialog */}
      <Modal
        visible={showSignOutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutConfirm(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setShowSignOutConfirm(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Sign Out</Text>
            <Text style={styles.dialogDesc}>You will be signed out on this device.</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowSignOutConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={confirmSignOut}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Demo mode confirmation dialog */}
      <Modal
        visible={showDemoConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDemoConfirm(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setShowDemoConfirm(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('demo.label').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('demo.replaceWarning')}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setShowDemoConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, { backgroundColor: colors.accent.yellow }]}
                onPress={confirmEnableDemo}
                activeOpacity={0.8}
              >
                <Text style={[styles.dialogConfirmText, { color: '#000' }]}>{t('demo.enable').toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                style={[styles.dialogConfirmBtn, isResetting && { opacity: 0.6 }]}
                onPress={handleReset}
                activeOpacity={0.8}
                disabled={isResetting}
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

