import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { NavHeader, GlowBackground } from '@/components';
import { supabaseConfigured } from '@/supabase/client';
import { makeStyles } from '@/screens/settings/settings.styles';
import { SettingsRow } from '@/screens/settings/SettingsRow';
import { SettingsDialogs } from '@/screens/settings/SettingsDialogs';
import { useSettings } from '@/screens/settings/useSettings';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const d = useSettings();

  const {
    router,
    store,
    players,
    teams,
    showNick,
    showTeamLogo,
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.title').toUpperCase()} onBack={() => d.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tournament */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.tournament.section').toUpperCase()}</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="🏆"
              label={t('settings.tournament.label')}
              sub={hasTournament ? tournamentName : t('settings.tournament.noActive')}
              onPress={() => router.push('/settings/tournaments')}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.data.section').toUpperCase()}</Text>
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

        {/* Display */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.display.section').toUpperCase()}</Text>
          <View style={styles.card}>
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[styles.themeBtn, colorScheme === 'dark' && styles.themeBtnActive]}
                onPress={() => store.setColorScheme('dark')}
                activeOpacity={0.75}
              >
                <Text style={styles.themeBtnIcon}>🌙</Text>
                <Text style={[styles.themeBtnLabel, colorScheme === 'dark' && styles.themeBtnLabelActive]}>
                  {t('settings.display.themeDark')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, colorScheme === 'light' && styles.themeBtnActive]}
                onPress={() => store.setColorScheme('light')}
                activeOpacity={0.75}
              >
                <Text style={styles.themeBtnIcon}>☀️</Text>
                <Text style={[styles.themeBtnLabel, colorScheme === 'light' && styles.themeBtnLabelActive]}>
                  {t('settings.display.themeLight')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, colorScheme === 'auto' && styles.themeBtnActive]}
                onPress={() => store.setColorScheme('auto')}
                activeOpacity={0.75}
              >
                <Text style={styles.themeBtnIcon}>🌓</Text>
                <Text style={[styles.themeBtnLabel, colorScheme === 'auto' && styles.themeBtnLabelActive]}>
                  {t('settings.display.themeAuto')}
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

        {/* Account */}
        {supabaseConfigured && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('settings.account.section').toUpperCase()}</Text>
            <View style={styles.card}>
              <SettingsRow icon="✉️" label={userEmail ?? '—'} sub={t('settings.account.signedIn')} chevron={false} />
              <View style={styles.divider} />
              <SettingsRow
                icon="🚪"
                label={t('settings.account.signOut')}
                chevron={false}
                onPress={d.handleSignOut}
              />
            </View>
          </View>
        )}

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.language.section').toUpperCase()}</Text>
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
          <Text style={styles.sectionHeader}>{t('settings.about.section').toUpperCase()}</Text>
          <View style={styles.card}>
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
          </View>
        </View>

        {/* Developer (hidden until unlocked) */}
        {devUnlocked && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.accent.blue }]}>{t('settings.developer.section').toUpperCase()}</Text>
            <View style={styles.card}>
              <SettingsRow
                icon="⚙️"
                label={t('settings.developer.menuLabel')}
                sub={t('settings.developer.menuSub')}
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
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.danger.section').toUpperCase()}</Text>
          <TouchableOpacity
            style={[styles.resetBtn, isDefaultState && styles.resetBtnDisabled]}
            onPress={() => !isDefaultState && d.setShowResetConfirm(true)}
            activeOpacity={isDefaultState ? 1 : 0.8}
          >
            <Text style={[styles.resetBtnText, isDefaultState && styles.resetBtnTextDisabled]}>
              🗑  {t('settings.danger.resetAll')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <SettingsDialogs d={d} />
    </SafeAreaView>
  );
}
