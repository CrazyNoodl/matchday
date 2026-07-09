import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { NavHeader, GlowBackground, SyncStatusIndicator, useSyncStatus } from '@/components';
import { supabaseConfigured } from '@/supabase/client';
import { makeStyles } from '@/screens/settings/settings.styles';
import { SettingsRow } from '@/screens/settings/SettingsRow';
import { SettingsSection } from '@/screens/settings/SettingsSection';
import { DangerZoneCard } from '@/screens/settings/DangerZoneCard';
import { SettingsDialogs } from '@/screens/settings/SettingsDialogs';
import { useSettings } from '@/screens/settings/useSettings';

const THEME_KEYS = {
  dark: 'settings.display.themeDark',
  light: 'settings.display.themeLight',
  auto: 'settings.display.themeAuto',
} as const;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const d = useSettings();
  const syncStatus = useSyncStatus();

  const {
    router,
    players,
    teams,
    showNick,
    colorScheme,
    hasTournament,
    tournamentName,
    demoMode,
    currentLang,
    isDefaultState,
    userEmail,
    versionTaps,
    devUnlocked,
  } = d;

  const appearanceSummary = `${t(THEME_KEYS[colorScheme])} · ${t(showNick ? 'settings.display.nicknamesOn' : 'settings.display.nicknamesOff')}`;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.title').toUpperCase()} onBack={() => d.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        {supabaseConfigured && (
          <View style={styles.accountCard}>
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarText}>✉️</Text>
            </View>
            <Text style={styles.accountEmail} numberOfLines={1}>
              {userEmail ?? '—'}
            </Text>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={d.handleSignOut}
              activeOpacity={0.75}
            >
              <Text style={styles.signOutBtnText}>{t('settings.account.signOut')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <SettingsSection title={t('settings.personalize.section')}>
          <SettingsRow
            icon="🎨"
            label={t('settings.display.section')}
            sub={appearanceSummary}
            onPress={() => router.push('/settings/display')}
          />
          <SettingsRow
            icon={currentLang.flag}
            label={t('settings.language.label')}
            sub={currentLang.nativeName}
            onPress={() => router.push('/settings/language')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.play.section')}>
          <SettingsRow
            icon="🏆"
            label={t('settings.tournament.label')}
            sub={hasTournament ? tournamentName : t('settings.tournament.noActive')}
            onPress={() => router.push('/settings/tournaments')}
          />
          <SettingsRow
            icon="👤"
            label={t('settings.data.players')}
            sub={t('settings.data.playersCount', { count: players.length })}
            onPress={() => router.push('/settings/players')}
          />
          <SettingsRow
            icon="🛡"
            label={t('settings.data.teams')}
            sub={t('settings.data.teamsCount', { count: teams.length })}
            onPress={() => router.push('/settings/teams')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.more.section')}>
          <SettingsRow
            icon="✨"
            label={t('demo.label')}
            sub={t('demo.desc')}
            onPress={() => d.handleDemoToggle(!demoMode)}
            right={
              <Switch
                value={demoMode}
                onValueChange={(v) => d.handleDemoToggle(v)}
                trackColor={{ false: colors.bg.elevated, true: colors.accent.yellow }}
                thumbColor={colors.text.primary}
              />
            }
            chevron={false}
          />
          <SettingsRow
            icon="💾"
            label={t('settings.data.backup')}
            sub={t('settings.data.backupSub')}
            onPress={() => router.push('/settings/backup')}
          />
          {syncStatus.visible && <SyncStatusIndicator />}
          <SettingsRow
            icon="ℹ️"
            label={t('settings.about.appName')}
            sub={
              devUnlocked
                ? t('settings.developer.devModeOn')
                : versionTaps >= 7
                  ? t('settings.developer.tapsToUnlock', { count: 10 - versionTaps })
                  : t('settings.about.version', { version: Constants.expoConfig?.version ?? '' })
            }
            onPress={d.handleVersionTap}
            chevron={false}
          />
          {devUnlocked && (
            <SettingsRow
              icon="⚙️"
              label={t('settings.developer.menuLabel')}
              sub={t('settings.developer.menuSub')}
              onPress={() => router.push('/settings/developer')}
            />
          )}
        </SettingsSection>

        <DangerZoneCard
          title={t('settings.danger.section')}
          label={t('settings.danger.resetAll')}
          description={
            demoMode ? t('settings.danger.resetDisabledDemo') : t('settings.danger.resetDesc')
          }
          buttonLabel={t('settings.danger.reset')}
          disabled={isDefaultState || demoMode}
          onPress={() => d.setShowResetConfirm(true)}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      <SettingsDialogs d={d} />
    </SafeAreaView>
  );
}
